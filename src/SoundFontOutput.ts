import { AudioContext, IAudioContext } from 'standardized-audio-context';
import WebAudioFontPlayer from 'webaudiofont';
import type {
  IMidiFile,
  IMidiProgramChangeEvent,
  IMidiNoteOnEvent,
  TMidiEvent,
} from 'midi-json-parser-worker';
import { setTimeout } from 'worker-timers';
import type { IMidiOutput } from 'midi-player';

const MIDI_CHANNEL_DRUMS = 9;
const SCHEDULER_TIMEOUT = 25;
const MIDI_MESSAGE_NOTEOFF = 8;
const MIDI_MESSAGE_NOTEON = 9;
const MIDI_PROGRAM_DEFAULT = 1;
const SCHEDULER_NOTE_LENGTH = 10;

type ChannelMap = Record<
  number,
  { instrumentInfo?: any; beats?: { drumInfo: any }[] }
>;

type Note = {
  channel: number;
  pitch: number;
  velocity: number;
  on: number;
  off: number | null;
  envelope: any;
};

export class SoundFontOutput implements IMidiOutput {
  private audioContext: IAudioContext;
  private player: any;
  private notes: Array<Note>;
  private channels: ChannelMap;

  constructor(midiJson: IMidiFile) {
    this.audioContext = new AudioContext();
    this.player = new WebAudioFontPlayer();
    this.notes = [];

    // Scan the MIDI for "program change" events, and load the corresponding instrument sample for each.
    this.channels = midiJson.tracks.reduce((channels, track) => {
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
          const instrumentNumber = this.player.loader.findInstrument(
            pc.programChange.programNumber,
          );
          const instrumentInfo =
            this.player.loader.instrumentInfo(instrumentNumber);
          channels[pc.channel] = { instrumentInfo };
          this.player.loader.startLoad(
            this.audioContext,
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
            const drumNumber = this.player.loader.findDrum(beat);
            const drumInfo = this.player.loader.drumInfo(drumNumber);
            channels[MIDI_CHANNEL_DRUMS].beats![beat] = { drumInfo };
            this.player.loader.startLoad(
              this.audioContext,
              drumInfo.url,
              drumInfo.variable,
            );
          });
        }
      }
      return channels;
    }, <ChannelMap>{});

    // Perform our own note scheduling.
    // Scan the current notes for those whose "off" timestamp has already occurred, and cancel their envelopes.
    // Then cleanup the array to keep the remaining notes.
    const scheduleNotes = () => {
      const now = performance.now();
      this.notes
        .filter((note) => note.off !== null && note.off <= now)
        .forEach((note) => note.envelope.cancel());
      this.notes = this.notes.filter(
        (note) => note.off === null || note.off > now,
      );
      setTimeout(scheduleNotes, SCHEDULER_TIMEOUT);
    };
    setTimeout(scheduleNotes, SCHEDULER_TIMEOUT);
  }

  send(data: number[] | Uint8Array, timestamp: number) {
    const channel: number = data[0] & 0xf;
    const type: number = data[0] >> 4;
    const pitch: number = data[1];
    const velocity: number = data[2];
    switch (type) {
      case MIDI_MESSAGE_NOTEON:
        if (velocity > 0) {
          this.noteOn(channel, pitch, timestamp, velocity);
        } else {
          this.noteOff(channel, pitch, timestamp);
        }
        break;
      case MIDI_MESSAGE_NOTEOFF:
        this.noteOff(channel, pitch, timestamp);
        break;
    }
    if (data.length > 3) {
      this.send(data.slice(3), timestamp);
    }
  }

  private noteOn(
    channel: number,
    pitch: number,
    timestamp: number,
    velocity: number,
  ) {
    // Schedule the incoming notes to start at the incoming timestamp,
    // and add them to the current notes array waiting for their future "off" event.
    const instrument =
      channel === MIDI_CHANNEL_DRUMS
        ? this.channels[channel].beats![pitch].drumInfo.variable
        : this.channels[channel].instrumentInfo!.variable;
    const when =
      this.audioContext.currentTime + (timestamp - performance.now()) / 1000;
    const envelope = this.player.queueWaveTable(
      this.audioContext,
      this.audioContext.destination,
      window[instrument],
      when,
      pitch,
      SCHEDULER_NOTE_LENGTH,
      velocity / 127,
    );
    envelope.cancel = () => {
      if (envelope && (envelope.when + envelope.duration > this.audioContext.currentTime)) {
        ((envelope as any) as GainNode).gain.cancelScheduledValues(this.audioContext.currentTime);
        ((envelope as any) as GainNode).gain.setTargetAtTime(0.00001, this.audioContext.currentTime, 0.1);
        envelope.when = this.audioContext.currentTime;
        envelope.duration = SCHEDULER_NOTE_LENGTH;
      }
    }
    this.notes.push({
      channel,
      pitch,
      velocity,
      on: timestamp,
      off: null,
      envelope,
    });
  }

  private noteOff(channel: number, pitch: number, timestamp: number) {
    // WebAudioFont cannot schedule a future note cancellation,
    // so we identify the target note and set its cancellation timestamp.
    // Our own scheduleNotes() scheduler will take care of cancelling the note
    // when its timestamp occurs.
    const note = this.notes.find(
      (note) =>
        note.pitch === pitch && note.channel === channel && note.off === null,
    );
    if (note) {
      note.off = timestamp;
    }
  }

  clear() {
    this.player.cancelQueue(this.audioContext);
    this.notes = [];
  }
}
