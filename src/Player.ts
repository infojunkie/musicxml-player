import {
  create as createMidiPlayer,
  IMidiOutput,
  IMidiPlayer,
  PlayerState,
} from 'midi-player';
import { binarySearch, parseMidiEvent, parseMusicXml } from './helpers';
import type { IMidiConverter } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
import { WebAudioFontOutput } from './WebAudioFontOutput';
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

const RESIZE_THROTTLE = 100;

export class Player implements IMidiOutput {
  static async load(options: PlayerOptions): Promise<Player> {
    const container =
      typeof options.container === 'string'
        ? document.getElementById(options.container)
        : options.container;
    if (!container) throw new Error('Failed to find container element.');

    const musicXmlAndTitle = await parseMusicXml(options.musicXml);
    if (!musicXmlAndTitle) throw new Error('Failed to parse MusicXML.');

    const { musicXml, title } = musicXmlAndTitle;
    await options.converter.initialize(musicXml);
    const output =
      options.output ?? new WebAudioFontOutput(options.converter.midi);

    const player = new Player(
      output,
      options.renderer,
      options.converter,
      musicXml,
      options.title ?? title,
      container,
    );
    await options.renderer.initialize(player, container, musicXml);
    return player;
  }

  private _midiPlayer: IMidiPlayer;
  private _startTime: MillisecsTimestamp;
  private _pauseTime: MillisecsTimestamp;
  private _currentMeasureStartTime: MillisecsTimestamp;
  private _currentMeasureIndex: MeasureIndex;
  private _timemapMeasureToTimestamp: Array<MillisecsTimestamp>;
  private _observer: ResizeObserver;

  private constructor(
    private _output: IMidiOutput,
    private _renderer: ISheetRenderer,
    private _converter: IMidiConverter,
    private _musicXml: string,
    private _title: string | null,
    private _container: HTMLElement,
  ) {
    this._midiPlayer = createMidiPlayer({
      json: this._converter.midi,
      midiOutput: this,
      filterMidiMessage: () => true,
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

    // Set up resize handling.
    // Throttle the resize event https://stackoverflow.com/a/5490021/209184
    let timeout: number | undefined = undefined;
    this._observer = new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this._renderer.resize();
      }, RESIZE_THROTTLE);
    });
    this._observer.observe(this._container);
  }

  destroy(): void {
    this._observer.disconnect();
    this._midiPlayer.stop();
    this._renderer.destroy();
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
    // Web MIDI does not accept meta messages.
    if ('channel' in event) {
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
}
