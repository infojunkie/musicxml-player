import { AudioContext, IAudioContext } from 'standardized-audio-context';
import { WebAudioFontPlayer } from 'webaudiofont';
import type {
  IMidiFile,
  IMidiProgramChangeEvent,
  IMidiNoteOnEvent,
  IMidiNoteOffEvent,
  IMidiPitchBendEvent,
  TMidiEvent,
} from 'midi-json-parser-worker';
import { setTimeout } from 'worker-timers';
import type { IMidiOutput } from 'midi-player';
import { parseMidiEvent } from './helpers';

const MIDI_CHANNEL_DRUMS = 9;
const SCHEDULER_TIMEOUT = 25;
const MIDI_PROGRAM_DEFAULT = 1;
const SCHEDULER_NOTE_LENGTH = 10;

type InstrumentMap = Record<
  number,
  { instrumentInfo?: any; beats?: { drumInfo: any }[] }
>;

type Note = {
  channel: number;
  pitch: number;
  velocity: number;
  when: number;
  off: number | null;
  envelope: any;
};

type PitchBend = {
  channel: number;
  pitchBend: number;
  when: number;
};

export class WebAudioFontOutput implements IMidiOutput {
  private _audioContext: IAudioContext;
  private _player: any;
  private _notes: Array<Note>;
  private _instruments: InstrumentMap;
  private _pitchBends: Array<PitchBend>;

  constructor(midiJson: IMidiFile) {
    this._audioContext = new AudioContext();
    this._player = new WebAudioFontPlayer();
    this._notes = [];
    this._pitchBends = [];

    // Scan the MIDI for "program change" events, and load the corresponding instrument sample for each.
    this._instruments = midiJson.tracks.reduce((channels, track) => {
      const pc =
        <IMidiProgramChangeEvent>track.find((e) => 'programChange' in e) ||
        <IMidiProgramChangeEvent>track.reduce(
          (pc: TMidiEvent | null, e: TMidiEvent) => {
            if ('noteOn' in e) {
              return <TMidiEvent>{
                channel: e.channel,
                programChange: {
                  programNumber: MIDI_PROGRAM_DEFAULT,
                },
              };
            }
            return pc;
          },
          null,
        );
      if (pc) {
        if (pc.channel !== MIDI_CHANNEL_DRUMS) {
          const instrumentNumber = this._player.loader.findInstrument(
            pc.programChange.programNumber,
          );
          const instrumentInfo =
            this._player.loader.instrumentInfo(instrumentNumber);
          channels[pc.channel] = { instrumentInfo };
          this._player.loader.startLoad(
            this._audioContext,
            instrumentInfo.url,
            instrumentInfo.variable,
          );
        } else {
          channels[MIDI_CHANNEL_DRUMS] = { beats: [] };
          [
            ...new Set(
              track
                .filter((e) => 'noteOn' in e)
                .map((e) => (<IMidiNoteOnEvent>e).noteOn.noteNumber),
            ),
          ].forEach((beat) => {
            const drumNumber = this._player.loader.findDrum(beat);
            const drumInfo = this._player.loader.drumInfo(drumNumber);
            channels[MIDI_CHANNEL_DRUMS].beats![beat] = { drumInfo };
            this._player.loader.startLoad(
              this._audioContext,
              drumInfo.url,
              drumInfo.variable,
            );
          });
        }
      }
      return channels;
    }, <InstrumentMap>{});

    // Perform our own note scheduling.
    // Scan the current notes for those whose "off" timestamp has already occurred, and cancel their envelopes.
    // Then cleanup the array to keep the remaining notes.
    const scheduleNotes = () => {
      const now = performance.now();
      this._notes
        .filter((note) => note.off !== null && note.off <= now)
        .forEach((note) => {
          // It can happen that the envelope expires before we get here,
          // and that WebAudioFontPlayer has already reused the envelope.
          // We don't want to cancel the envelope in this case, and we detect
          // it by comparing the original onset with the current one.
          // They are different if the envelope has alreasdy been reused.
          if (note.when === note.envelope.when) {
            note.envelope.cancel();
          }
          note.envelope = null;
        });
      this._notes = this._notes.filter((note) => !!note.envelope);
      setTimeout(scheduleNotes, SCHEDULER_TIMEOUT);
    };
    setTimeout(scheduleNotes, SCHEDULER_TIMEOUT);
  }

  send(data: number[] | Uint8Array, timestamp: number) {
    const event = parseMidiEvent(data);
    if ('noteOn' in event) {
      this._noteOn(<IMidiNoteOnEvent>event, timestamp);
    } else if ('noteOff' in event) {
      this._noteOff(<IMidiNoteOffEvent>event, timestamp);
    } else if ('pitchBend' in event) {
      this._pitchBend(<IMidiPitchBendEvent>event, timestamp);
    }
  }

  private _noteOn(event: IMidiNoteOnEvent, timestamp: number) {
    // Schedule the incoming notes to start at the incoming timestamp,
    // and add them to the current notes array waiting for their future "off" event.
    const instrument =
      event.channel === MIDI_CHANNEL_DRUMS
        ? this._instruments[event.channel].beats![event.noteOn.noteNumber]
            .drumInfo.variable
        : this._instruments[event.channel].instrumentInfo!.variable;
    const when = this._timestampToAudioContext(timestamp);

    // Find the latest pitch bend that applies here.
    const pb = this._pitchBends
      .filter((pb) => {
        return event.channel === pb.channel && when >= pb.when;
      })
      .reduce((max: PitchBend | null, pb) => {
        return !max || pb.when > max.when ? pb : max;
      }, null);

    // Schedule the note.
    const envelope = this._player.queueWaveTable(
      this._audioContext,
      this._audioContext.destination,
      window[instrument],
      when,
      event.noteOn.noteNumber,
      SCHEDULER_NOTE_LENGTH,
      event.noteOn.velocity / 127,
      pb
        ? [
            {
              delta: (pb.pitchBend - 8192) / 4096,
              when: 0,
            },
          ]
        : [],
    );
    this._notes.push({
      channel: event.channel,
      pitch: event.noteOn.noteNumber,
      velocity: event.noteOn.velocity,
      when: envelope.when,
      off: null,
      envelope,
    });
  }

  private _noteOff(event: IMidiNoteOffEvent, timestamp: number) {
    // WebAudioFont cannot schedule a future note cancellation,
    // so we identify the target note and set its cancellation timestamp.
    // Our own scheduleNotes() scheduler will take care of cancelling the note
    // when its timestamp occurs.
    const note = this._notes.find(
      (note) =>
        note.pitch === event.noteOff.noteNumber &&
        note.channel === event.channel &&
        note.off === null,
    );
    if (note) {
      note.off = timestamp;
    }
  }

  private _pitchBend(event: IMidiPitchBendEvent, timestamp: number) {
    // Save the current pitch bend value. It will be used at the next noteOn event.
    this._pitchBends.push({
      channel: event.channel,
      pitchBend: event.pitchBend,
      when: this._timestampToAudioContext(timestamp),
    });
  }

  private _timestampToAudioContext(timestamp: number) {
    return (
      this._audioContext.currentTime + (timestamp - performance.now()) / 1000
    );
  }

  clear() {
    this._player.cancelQueue(this._audioContext);
    this._notes = [];
  }
}
