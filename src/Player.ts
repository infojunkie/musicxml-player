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
import SaxonJS from './saxon-js/SaxonJS2.rt';
import pkg from '../package.json';

const XSL_UNROLL =
  'https://raw.githubusercontent.com/infojunkie/musicxml-mma/main/musicxml-unroll.sef.json';

export type MeasureIndex = number;
export type MillisecsTimestamp = number;

export interface PlayerOptions {
  /**
   * The HTML element containing the sheet.
   */
  container: HTMLDivElement | string;
  /**
   * The input MusicXML score, as text string or compressed ArrayBuffer.
   */
  musicXml: ArrayBuffer | string;
  /**
   * An instance of the sheet renderer used to render the score.
   */
  renderer: ISheetRenderer;
  /**
   * An instance of the MIDI converter used to convert the score to MIDI.
   */
  converter: IMidiConverter;
  /**
   * (Optional) An instance of the MIDI output to send the note events.
   * If ommitted, a local Web Audio synthesizer will be used.
   */
  output?: IMidiOutput;
  /**
   * (Optional) An override to the score title.
   */
  title?: string;
  /**
   * (Optional) A flag to unroll the score before displaying it and playing it.
   */
  unroll?: boolean;
}

const RESIZE_THROTTLE = 100;

export class Player implements IMidiOutput {
  static async load(options: PlayerOptions): Promise<Player> {
    // Create the inner sheet element.
    const container =
      typeof options.container === 'string'
        ? document.getElementById(options.container)
        : options.container;
    if (!container) throw new Error('Failed to find container element.');
    const sheet = document.createElement('div');
    sheet.className = 'player-sheet';
    container.appendChild(sheet);

    try {
      const parseResult = await parseMusicXml(options.musicXml, {
        title: '//work/work-title/text()',
        version: '//score-partwise/@version',
      });
      let musicXml = parseResult.musicXml;
      if (options.unroll) {
        musicXml = await Player._unroll(musicXml);
      }
      await options.converter.initialize(musicXml);
      const output =
        options.output ?? new WebAudioFontOutput(options.converter.midi);

      const player = new Player(
        output,
        options.renderer,
        options.converter,
        musicXml,
        options.title ?? parseResult.queries['title'].result,
        sheet,
        options,
      );
      await options.renderer.initialize(player, sheet, musicXml);
      return player;
    } catch (error) {
      console.error(`[MusicXML Player] ${error}`);
      throw error;
    }
  }

  private _midiPlayer: IMidiPlayer;
  private _playbackStart: MillisecsTimestamp;
  private _playbackPause: MillisecsTimestamp;
  private _measureIndex: MeasureIndex;
  private _measureStart: MillisecsTimestamp;
  private _measureOffset: MillisecsTimestamp;
  private _timemap: Record<
    MeasureIndex,
    {
      start: MillisecsTimestamp;
      duration: MillisecsTimestamp;
    }
  >;
  private _observer: ResizeObserver;

  private constructor(
    private _output: IMidiOutput,
    private _renderer: ISheetRenderer,
    private _converter: IMidiConverter,
    private _musicXml: string,
    private _title: string | null,
    private _container: HTMLElement,
    public readonly options: PlayerOptions,
  ) {
    // Create the MIDI player.
    this._midiPlayer = createMidiPlayer({
      json: this._converter.midi,
      midiOutput: this,
      filterMidiMessage: () => true,
    });

    // Initialize the playback state.
    this._playbackStart = 0;
    this._playbackPause = 0;
    this._measureIndex = 0;
    this._measureStart = 0;
    this._measureOffset = 0;

    // Build a specialized timemap for faster lookup.
    this._timemap = [];
    this._converter.timemap.forEach((entry, i, timemap) => {
      if (typeof this._timemap[entry.measure] === 'undefined') {
        this._timemap[entry.measure] = {
          start: entry.timestamp,
          // Get the measure duration by subtracting the next measure's timestamp.
          // FIXME: If we're at the last measure, we just set 0 for now.
          duration:
            i < timemap.length - 1
              ? timemap[i + 1].timestamp - entry.timestamp
              : 0,
        };
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
    this._container.remove();
    this._observer.disconnect();
    this._midiPlayer.stop();
    this._renderer.destroy();
  }

  moveTo(
    measureIndex: MeasureIndex,
    measureStart: MillisecsTimestamp,
    measureOffset: MillisecsTimestamp,
  ) {
    // Set the playback position.
    const now = performance.now();
    const timestamp = this._timemap[measureIndex].start + measureOffset;
    this._midiPlayer.seek(timestamp);
    this._measureIndex = measureIndex;
    // The local measure start is measured in absolute time,
    // whereas the incoming measure start is measured relative to the MIDI file.
    this._measureStart = now - measureOffset;
    this._playbackStart = now - timestamp;
    this._playbackPause = now;

    // Set the cursor position.
    this._renderer.moveTo(measureIndex, measureStart, measureOffset);
  }

  async play() {
    if (this._midiPlayer.state === PlayerState.Playing) return;
    await this._play();
  }

  async pause() {
    if (this._midiPlayer.state !== PlayerState.Playing) return;
    this._midiPlayer.pause();
    this._playbackPause = performance.now();
  }

  async rewind() {
    this._midiPlayer.stop();
    this._playbackStart = 0;
    this._renderer.moveTo(0, 0, 0);
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
      this._playbackStart !== 0
    ) {
      this._playbackStart += now - this._playbackPause;
      this._measureStart += now - this._playbackPause;
    } else {
      this._playbackStart = now;
      this._measureIndex = 0;
      this._measureStart = now;
    }

    const synchronizeMidi = (now: number) => {
      if (this._midiPlayer.state !== PlayerState.Playing) return;

      // Lookup the current measure number by binary-searching the timemap.
      const index = binarySearch(
        this._converter.timemap,
        {
          measure: 0,
          timestamp: now - this._playbackStart,
        },
        (a, b) => {
          const d = a.timestamp - b.timestamp;
          if (Math.abs(d) < Number.EPSILON) return 0;
          return d;
        },
      );
      const entry =
        this._converter.timemap[index >= 0 ? index : Math.max(0, -index - 2)];
      if (this._measureIndex !== entry.measure) {
        this._measureIndex = entry.measure;
        this._measureStart = now;
      }
      this._measureOffset = Math.max(0, now - this._measureStart);
      this._renderer.moveTo(
        this._measureIndex,
        this._timemap[this._measureIndex].start,
        this._measureOffset,
        this._timemap[this._measureIndex].duration,
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
      this._playbackStart = 0;
    }
  }

  private static async _unroll(musicXml: string): Promise<string> {
    try {
      const unroll = await SaxonJS.transform(
        {
          stylesheetLocation: XSL_UNROLL,
          sourceText: musicXml,
          destination: 'serialized',
          stylesheetParams: { renumberMeasures: true },
        },
        'async',
      );
      return unroll.principalResult;
    } catch (error) {
      console.warn(`[Parser._unroll] ${error}`);
    }
    return musicXml;
  }
}
