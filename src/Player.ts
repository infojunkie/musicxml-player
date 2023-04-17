import {
  create as createMidiPlayer,
  IMidiOutput,
  IMidiPlayer,
  PlayerState,
} from 'midi-player';
import type { TMidiEvent } from 'midi-json-parser-worker';
import { binarySearch, parseMidiEvent, parseMusicXml } from './helpers';
import type { IMidiConverter } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
import { SoundFontOutput } from './SoundFontOutput';
import pkg from '../package.json';

export type MeasureIndex = number;
export type MillisecsTimestamp = number;

export interface PlayerOptions {
  container: HTMLDivElement | string;
  musicXml: ArrayBuffer | string;
  renderer: ISheetRenderer;
  converter: IMidiConverter;
  output?: IMidiOutput;
  title?: string;
}

export class Player implements IMidiOutput {
  static async load(options: PlayerOptions): Promise<Player> {
    const musicXmlAndTitle = await parseMusicXml(options.musicXml);
    if (!musicXmlAndTitle) throw new Error('Failed to parse MusicXML.');

    const { musicXml, title } = musicXmlAndTitle;
    await options.converter.initialize(musicXml);
    const output =
      options.output ?? new SoundFontOutput(options.converter.midi);
    const player = new Player(
      output,
      options.renderer,
      options.converter,
      musicXml,
      options.title ?? title,
    );
    await options.renderer.initialize(player, options.container, musicXml);
    return player;
  }

  private _midiPlayer: IMidiPlayer;
  private _startTime: MillisecsTimestamp;
  private _pauseTime: MillisecsTimestamp;
  private _currentMeasureStartTime: MillisecsTimestamp;
  private _currentMeasureIndex: MeasureIndex;
  private _timemapMeasureToTimestamp: Array<MillisecsTimestamp>;

  private constructor(
    private _output: IMidiOutput,
    private _renderer: ISheetRenderer,
    private _converter: IMidiConverter,
    private _musicXml: string,
    private _title: string | null,
  ) {
    this._midiPlayer = createMidiPlayer({
      json: this._converter.midi,
      midiOutput: this,
      isSendableEvent: () => true,
    });
    this._startTime = 0;
    this._pauseTime = 0;
    this._currentMeasureIndex = 0;
    this._currentMeasureStartTime = 0;

    // Build a specialized timemap for faster lookup.
    this._timemapMeasureToTimestamp = [];
    this._converter.timemap.forEach((entry) => {
      if (
        typeof this._timemapMeasureToTimestamp[entry.measure] === 'undefined'
      ) {
        this._timemapMeasureToTimestamp[entry.measure] = entry.timestamp;
      }
    });
  }

  moveTo(measure: MeasureIndex, offset: MillisecsTimestamp) {
    const timestamp = this._timemapMeasureToTimestamp[measure] + offset;
    this._midiPlayer.seek(timestamp);
    this._currentMeasureIndex = measure;
    const now = performance.now();
    this._currentMeasureStartTime = now - offset;
    this._startTime = now - timestamp;
    this._pauseTime = now;
  }

  async play() {
    if (this._midiPlayer.state === PlayerState.Playing) return;
    await this._play();
  }

  async pause() {
    if (this._midiPlayer.state !== PlayerState.Playing) return;
    this._midiPlayer.pause();
    this._pauseTime = performance.now();
  }

  async rewind() {
    this._midiPlayer.stop();
    this._renderer.moveTo(0, 0);
    this._startTime = 0;
  }

  get musicXml(): string {
    return this._musicXml;
  }

  get state(): PlayerState {
    return this._midiPlayer.state;
  }

  get title(): string | null {
    return this._title;
  }

  get version(): Record<string, string> {
    return {
      player: `${pkg.name} v${pkg.version}`,
      renderer: this._renderer.version,
      converter: this._converter.version,
    };
  }

  // We implement IMidiOutput here to capture any interesting events
  // such as MARKER events with Groove information.
  send(data: number[] | Uint8Array, timestamp?: number) {
    const event = parseMidiEvent(data);
    // TODO I don't understand why events need to be filtered before going to Web MIDI
    // https://github.com/chrisguttandin/midi-player/issues/354
    if (Player._isSendableEvent(event)) {
      this._output.send(data, timestamp);
    }
  }

  clear() {
    this._output.clear?.();
  }

  private async _play() {
    const now = performance.now();
    if (
      this._midiPlayer.state === PlayerState.Paused ||
      this._startTime !== 0
    ) {
      this._startTime += now - this._pauseTime;
      this._currentMeasureStartTime += now - this._pauseTime;
    } else {
      this._startTime = now;
      this._currentMeasureIndex = 0;
      this._currentMeasureStartTime = now;
    }

    const synchronizeMidi = (now: number) => {
      if (this._midiPlayer.state !== PlayerState.Playing) return;

      // Lookup the current measure number by binary-searching the timemap.
      const index = binarySearch(
        this._converter.timemap,
        {
          measure: 0,
          timestamp: now - this._startTime,
        },
        (a, b) => {
          const d = a.timestamp - b.timestamp;
          if (Math.abs(d) < Number.EPSILON) return 0;
          return d;
        },
      );
      const entry =
        this._converter.timemap[index >= 0 ? index : Math.max(0, -index - 2)];
      if (this._currentMeasureIndex !== entry.measure) {
        this._currentMeasureIndex = entry.measure;
        this._currentMeasureStartTime = now;
      }
      this._renderer.moveTo(
        this._currentMeasureIndex,
        Math.max(0, now - this._currentMeasureStartTime),
      );

      // Schedule next cursor movement.
      requestAnimationFrame(synchronizeMidi);
    };

    // Schedule first cursor movement.
    requestAnimationFrame(synchronizeMidi);

    // Activate the MIDI player.
    if (this._midiPlayer.state === PlayerState.Paused) {
      await this._midiPlayer.resume();
    } else {
      await this._midiPlayer.play();
    }

    // Reset when done.
    if (this._midiPlayer.state !== PlayerState.Paused) {
      this._startTime = 0;
    }
  }

  private static _isSendableEvent(event: TMidiEvent): boolean {
    return (
      'controlChange' in event ||
      'noteOff' in event ||
      'noteOn' in event ||
      'programChange' in event
    );
  }
}
