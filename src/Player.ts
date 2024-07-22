import {
  create as createMidiPlayer,
  IMidiOutput,
  IMidiPlayer,
  PlayerState,
} from 'midi-player';
import { encode as encodeMidiFile } from 'json-midi-encoder';
import { IMidiFile, IMidiSetTempoEvent } from 'midi-json-parser-worker';
import {
  binarySearch,
  parseMidiEvent,
  parseMusicXML,
  MusicXMLParseResult,
} from './helpers';
import type { IMidiConverter } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
import { WebAudioFontOutput } from './WebAudioFontOutput';
import { ITimingObject } from 'timing-object';
import SaxonJS from './saxon-js/SaxonJS2.rt';
import pkg from '../package.json';

const XSL_UNROLL =
  'https://raw.githubusercontent.com/infojunkie/musicxml-midi/main/build/unroll.sef.json';

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
   * (Optional) An instance of a TimingObject.
   */
  timingsrc?: ITimingObject;
  /**
   * (Optional) An override to the score title.
   */
  title?: string;
  /**
   * (Optional) A flag to unroll the score before displaying it and playing it.
   */
  unroll?: boolean;
  /**
   * (Optional) A flag to mute the player's MIDI output.
   * It also exists as a dynamic flag during playback.
   */
  mute?: boolean;
}

const RESIZE_THROTTLE = 100;

export class Player implements IMidiOutput {
  static async load(options: PlayerOptions): Promise<Player> {
    // Create the inner sheet element.
    const container =
      typeof options.container === 'string'
        ? document.getElementById(options.container)
        : options.container;
    if (!container)
      throw new Error('[Player.load] Failed to find container element.');
    const sheet = document.createElement('div');
    sheet.className = 'player-sheet';
    container.appendChild(sheet);

    try {
      // Parse the incoming MusicXML and unroll it if needed.
      const parseResult = await parseMusicXML(options.musicXml, {
        title: '//work/work-title/text()',
        version: '//score-partwise/@version',
      });
      let musicXml = parseResult.musicXml;
      if (options.unroll) {
        musicXml = await Player._unroll(musicXml);
      }

      // Initialize the various objects.
      // This is done in a specific sequence to ensure the dependency chain is respected.
      // It's too bad that constructors cannot be made async because that would simplify the code.
      await options.converter.initialize(musicXml);
      const player = new Player(options, sheet, parseResult, musicXml);
      await options.renderer.initialize(player, sheet, musicXml);
      return player;
    } catch (error) {
      console.error(`[Player.load] ${error}`);
      throw error;
    }
  }

  private _output: IMidiOutput;
  private _midiPlayer: IMidiPlayer;
  private _observer: ResizeObserver;
  private _timingsrc: ITimingObject | undefined;
  private _timingsrcListener: EventListener;
  private _midiFile: IMidiFile;

  /**
   * A dynamic flag to mute the player's MIDI output.
   */
  public mute: boolean;

  private constructor(
    private _options: PlayerOptions,
    private _sheet: HTMLElement,
    private _parseResult: MusicXMLParseResult,
    private _musicXml: string,
  ) {
    // Manipulate the incoming MIDI file to move the MIDI End Of Track message to the end of the last measure.
    this._midiFile = this._options.converter.midi;
    try {
      const track = this._midiFile.tracks[0];
      const event = track.last();
      if ('endOfTrack' in event) {
        const entry = this._options.converter.timemap.last();
        // 500000 = 60,000,000 microseconds per minute / 120 beats per minute
        const microsecondsPerQuarter =
          track
            .filter((event): event is IMidiSetTempoEvent => 'setTempo' in event)
            .last()?.setTempo.microsecondsPerQuarter ?? 500000;
        event.delta +=
          (entry.duration * this._midiFile.division * 1000) /
          microsecondsPerQuarter;
      } else {
        console.warn(
          `[Player.constructor] Error fixing MIDI End Of Track event: Last event is not End Of Track.`,
        );
      }
    } catch (error) {
      console.error(
        `[Player.constructor] Error fixing MIDI End Of Track event: ${error}`,
      );
    }

    // Set or create the MIDI output.
    this._output =
      this._options.output ?? new WebAudioFontOutput(this._midiFile);

    // Create the MIDI player.
    // Wrap IMidiPlayer.stop() with a try...catch to call it freely.
    this._midiPlayer = new Proxy(
      createMidiPlayer({
        json: this._midiFile,
        midiOutput: this,
        filterMidiMessage: () => true,
      }),
      {
        get(target, prop) {
          if (prop === 'stop') {
            return () => {
              try {
                target.stop();
              } catch {
                // Do nothing.
              }
            };
          } else {
            return Reflect.get(target, prop);
          }
        },
      },
    );

    // Initialize the playback state.
    this.mute = this._options.mute ?? false;

    // Set up resize handling.
    // Throttle the resize event https://stackoverflow.com/a/5490021/209184
    let timeout: number | undefined = undefined;
    this._observer = new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this._options.renderer.resize();
      }, RESIZE_THROTTLE);
    });
    this._observer.observe(this._sheet);

    // Set up TimingObject listeners.
    this.timingsrc = undefined;
    this._timingsrcListener = (event) => this._handleTimingsrcChange(event);
    this.timingsrc = this._options.timingsrc;
  }

  destroy(): void {
    this.timingsrc = undefined;
    this._sheet.remove();
    this._observer.disconnect();
    this._midiPlayer.stop();
    this._options.renderer.destroy();
  }

  moveTo(
    measureIndex: MeasureIndex,
    measureStart: MillisecsTimestamp,
    measureOffset: MillisecsTimestamp,
  ) {
    // Set the playback position.
    // TODO: Find the closest instance of the measure based on current playback position.
    const entry = this._options.converter.timemap.find(
      (e) => e.measure == measureIndex,
    );
    if (entry) {
      this._midiPlayer.position = entry.timestamp + measureOffset;
    }

    // Set the cursor position.
    this._options.renderer.moveTo(measureIndex, measureStart, measureOffset);
  }

  async play(velocity: number = 1) {
    if (this._midiPlayer.state === PlayerState.Playing) return;
    if (this._output instanceof WebAudioFontOutput) {
      await (this._output as WebAudioFontOutput).initialize();
    }
    await this._play(velocity);
  }

  async pause() {
    if (this._midiPlayer.state !== PlayerState.Playing) return;
    this._midiPlayer.pause();
  }

  async rewind() {
    this._midiPlayer.stop();
    this._options.renderer.moveTo(0, 0, 0);
  }

  get musicXml(): string {
    return this._musicXml;
  }

  async midi(): Promise<ArrayBuffer> {
    return await encodeMidiFile(this._midiFile);
  }

  get state(): PlayerState {
    return this._midiPlayer.state;
  }

  get title(): string {
    return (
      this._options.title ?? this._parseResult.queries['title'].result ?? ''
    );
  }

  get version(): Record<string, string> {
    return {
      player: `${pkg.name} v${pkg.version}`,
      renderer: this._options.renderer.version,
      converter: this._options.converter.version,
    };
  }

  // TimingObject interface.
  get timingsrc(): ITimingObject | undefined {
    return this._timingsrc;
  }

  set timingsrc(timingsrc: ITimingObject | undefined) {
    this._timingsrc?.update({ position: 0, velocity: 0 });
    this._timingsrc?.removeEventListener('change', this._timingsrcListener);
    this._timingsrc = timingsrc;
    this._timingsrc?.addEventListener('change', this._timingsrcListener);
  }

  // We implement IMidiOutput here to capture any interesting events
  // such as MARKER events with Groove information.
  send(data: number[] | Uint8Array, timestamp?: number) {
    if (this.mute) return;
    const event = parseMidiEvent(data);
    // Web MIDI does not accept meta messages.
    if ('channel' in event) {
      this._output.send(data, timestamp);
    }
  }

  clear() {
    this._output.clear?.();
  }

  private async _play(velocity: number) {
    const synchronizeMidi = () => {
      if (this._midiPlayer.state !== PlayerState.Playing) return;

      // Lookup the current measure number by binary-searching the timemap.
      const timestamp = this._midiPlayer.position!;
      const index = binarySearch(
        this._options.converter.timemap,
        {
          measure: 0,
          timestamp,
          duration: 0,
        },
        (a, b) => {
          const d = a.timestamp - b.timestamp;
          if (Math.abs(d) < Number.EPSILON) return 0;
          return d;
        },
      );
      const entry =
        this._options.converter.timemap[
          index >= 0 ? index : Math.max(0, -index - 2)
        ];
      this._options.renderer.moveTo(
        entry.measure,
        entry.timestamp,
        Math.max(0, timestamp - entry.timestamp),
        entry.duration,
      );

      // Schedule next cursor movement.
      requestAnimationFrame(synchronizeMidi);
    };

    // Schedule first cursor movement.
    requestAnimationFrame(synchronizeMidi);

    // Activate the MIDI player.
    if (this._midiPlayer.state === PlayerState.Paused) {
      await this._midiPlayer.resume(velocity);
    } else {
      await this._midiPlayer.play(velocity);
    }
  }

  private _handleTimingsrcChange(_event: Event) {
    const timingsrc = this._timingsrc as ITimingObject;
    const vector = timingsrc.query();
    if (Math.abs(vector.velocity) < Number.EPSILON) {
      if (Math.abs(vector.position) < Number.EPSILON) {
        this.rewind();
      } else {
        this.pause();
      }
    } else {
      switch (this._midiPlayer.state) {
        case PlayerState.Playing:
          this._midiPlayer.velocity = vector.velocity;
          break;
        case PlayerState.Paused:
        case PlayerState.Stopped:
          this.play(vector.velocity);
          break;
      }
    }
  }

  private static async _unroll(musicXml: string): Promise<string> {
    try {
      const unroll = await SaxonJS.transform(
        {
          stylesheetLocation: XSL_UNROLL,
          sourceText: musicXml,
          destination: 'serialized',
          stylesheetParams: {
            renumberMeasures: true,
          },
        },
        'async',
      );
      return unroll.principalResult;
    } catch (error) {
      console.error(`[Player._unroll] ${error}`);
    }
    return musicXml;
  }
}
