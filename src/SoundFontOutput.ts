import { AudioContext, IAudioContext } from 'standardized-audio-context';
import WebAudioFontPlayer from 'webaudiofont';
import type {
  IMidiFile,
  IMidiProgramChangeEvent,
  IMidiNoteOnEvent,
} from 'midi-json-parser-worker';
import { setTimeout } from 'worker-timers';
import type { IMidiOutput } from 'midi-player';

const MIDI_CHANNEL_DRUMS = 9;
const SCHEDULER_TIMEOUT = 25;

type TChannelMap = Record<
  number,
  { instrumentInfo?: any; beats?: { drumInfo: any }[] }
>;

type TNote = {
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
  private notes: Array<TNote>;
  private channels: TChannelMap;

  constructor(midiJson: IMidiFile) {
    this.audioContext = new AudioContext();
    this.player = new WebAudioFontPlayer();
    this.notes = [];
    this.channels = midiJson.tracks.reduce((channels, track) => {
      const pc = <IMidiProgramChangeEvent>(
        track.find((e) => 'programChange' in e)
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
    }, <TChannelMap>{});

    // Perform our own note scheduling.
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
      case 9:
        if (velocity > 0) {
          this.noteOn(channel, pitch, timestamp, velocity);
        } else {
          this.noteOff(channel, pitch, timestamp);
        }
        break;
      case 8:
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
    const instrument =
      channel === MIDI_CHANNEL_DRUMS
        ? this.channels[channel].beats![pitch].drumInfo.variable
        : this.channels[channel].instrumentInfo!.variable;
    const when =
      this.audioContext.currentTime + (timestamp - performance.now()) / 1000;
    this.notes.push({
      channel,
      pitch,
      velocity,
      on: timestamp,
      off: null,
      envelope: this.player.queueWaveTable(
        this.audioContext,
        this.audioContext.destination,
        window[instrument],
        when,
        pitch,
        100000,
        velocity / 127,
      ),
    });
  }

  private noteOff(channel: number, pitch: number, timestamp: number) {
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
