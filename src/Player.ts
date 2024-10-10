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
import { ITimingObject, TimingObject } from 'timing-object';
import SaxonJS from './saxon-js/SaxonJS2.rt';
import pkg from '../package.json';

const XSL_UNROLL =
  'https://raw.githubusercontent.com/infojunkie/musicxml-midi/main/build/unroll.sef.json';

export type MeasureIndex = number;
export type MillisecsTimestamp = number;

/**
 * A structure holding the Player creation options.
 */
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
   * (Optional) A flag to unroll the score before displaying it and playing it.
   */
  unroll?: boolean;
  /**
   * (Optional) A flag to mute the player's MIDI output.
   * Can also be changed dynamically via Player.mute attribute.
   */
  mute?: boolean;
  /**
   * (Optional) Repeat count. A value of -1 means loop forever.
   * Can also be changed dynamically via Player.repeat attribute.
   */
  repeat?: number;
  /**
   * (Optional) Playback speed. A value of 1 means normal speed.
   * Can also be changed dynamically via Player.velocity attribute.
   */
  velocity?: number;
}

const RESIZE_THROTTLE = 100;

export class Player implements IMidiOutput {
  /**
   * Create a new instance of the player.
   *
   * @param options Player options.
   * @returns A new instance of the player, ready to play.
   * @throws Error exception with various error messages.
   */
  static async create(options: PlayerOptions): Promise<Player> {
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
      // It's too bad that constructors cannot be made async because that would simplify the code.
      await options.converter.initialize(musicXml);
      await options.renderer.initialize(sheet, musicXml);
      const player = new Player(options, sheet, parseResult, musicXml);
      return player;
    } catch (error) {
      console.error(`[Player.load] ${error}`);
      throw error;
    }
  }

  protected _output: IMidiOutput;
  protected _midiPlayer: IMidiPlayer;
  protected _observer: ResizeObserver;
  protected _midiFile: IMidiFile;
  protected _duration: number;
  protected _mute: boolean;
  protected _repeat: number;
  protected _velocity: number;
  protected _timingObject: ITimingObject;
  protected _timingObjectListener: EventListener;

  protected constructor(
    protected _options: PlayerOptions,
    protected _sheet: HTMLElement,
    protected _parseResult: MusicXMLParseResult,
    protected _musicXml: string,
  ) {
    // Inform the renderer that we're here.
    this._options.renderer.player = this;

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

    // Initialize the playback options.
    this._repeat = this._options.repeat ?? 1;
    this._mute = this._options.mute ?? false;
    this._velocity = this._options.velocity ?? 1;
    this._duration =
      this._options.converter.timemap.last().timestamp +
      this._options.converter.timemap.last().duration;

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

    // Create the TimingObject.
    this._timingObject = new TimingObject(
      { velocity: this._velocity, position: 0 },
      0,
      this.duration,
    );
    this._timingObjectListener = (event) =>
      this._handleTimingObjectChange(event);
    this._timingObject.addEventListener('change', this._timingObjectListener);
  }

  /**
   * Destroy the instance by freeing all resources and disconnecting observers.
   */
  destroy(): void {
    // Never fail during destruction.
    try {
      this._timingObject.removeEventListener(
        'change',
        this._timingObjectListener,
      );
      this._sheet.remove();
      this._observer.disconnect();
      this._midiPlayer.stop();
      this._options.renderer.destroy();
    } catch (error) {
      console.error(`[Player.destroy] ${error}`);
    }
  }

  /**
   * Advance the playback and visual cursor to a given location.
   *
   * @param measureIndex Measure index (0-based)
   * @param measureStart Timestamp of measure onset in real time (ms)
   * @param measureOffset Timestamp offset within measure (ms)
   */
  moveTo(
    measureIndex: MeasureIndex,
    measureStart: MillisecsTimestamp,
    measureOffset: MillisecsTimestamp,
  ) {
    // If the player is stopped, set it to paused before continuing.
    if (this._midiPlayer.state === PlayerState.Stopped) {
      this._midiPlayer.play();
      this._midiPlayer.pause();
    }

    // Set the playback position.
    // Find the closest instance of the measure based on current playback position.
    const position = this.position - measureOffset;
    const entry = this._options.converter.timemap
      .filter((e) => e.measure == measureIndex)
      .sort((a, b) => {
        const a_distance = Math.abs(a.timestamp - position);
        const b_distance = Math.abs(b.timestamp - position);
        return b_distance - a_distance;
      })
      .last();
    if (entry) {
      this._midiPlayer.position = entry.timestamp + measureOffset;
    }

    // Set the cursor position.
    this._options.renderer.moveTo(measureIndex, measureStart, measureOffset);
  }

  /**
   * Start playback.
   *
   * @param velocity Playback rate
   * @returns A promise that resolves when the player is paused or stopped.
   */
  async play() {
    if (this._midiPlayer.state === PlayerState.Playing) return;
    if (this._output instanceof WebAudioFontOutput) {
      await (this._output as WebAudioFontOutput).initialize();
    }
    await this._play();
  }

  /**
   * Pause playback.
   */
  pause() {
    if (this._midiPlayer.state !== PlayerState.Playing) return;
    this._midiPlayer.pause();
    this._timingObject.update({ velocity: 0 });
  }

  /**
   * Stop playback and rewind to start.
   */
  rewind() {
    this._midiPlayer.stop();
    this._options.renderer.moveTo(0, 0, 0);
    this._timingObject.update({ velocity: 0, position: 0 });
  }

  /**
   * The version numbers of the player components.
   */
  get version(): Record<string, string> {
    return {
      player: `${pkg.name} v${pkg.version}`,
      renderer: this._options.renderer.version,
      converter: this._options.converter.version,
    };
  }

  /**
   * The MusicXML score.
   */
  get musicXml(): string {
    return this._musicXml;
  }

  /**
   * The MIDI file.
   * @returns A promise that resolves to the ArrayBuffer containing the MIDI file binary representation.
   */
  async midi(): Promise<ArrayBuffer> {
    return await encodeMidiFile(this._midiFile);
  }

  /**
   * The player state.
   */
  get state(): PlayerState {
    return this._midiPlayer.state;
  }

  /**
   * The score title (can be blank).
   */
  get title(): string {
    return this._parseResult.queries['title'].result ?? '';
  }

  /**
   * The duration of the score/MIDI file (ms).
   * Precomputed in the constructor.
   */
  get duration(): number {
    return this._duration;
  }

  /**
   * Current position of the player (ms).
   */
  get position(): number {
    return Math.max(
      0,
      Math.min(this._midiPlayer.position ?? 0, this._duration - 1),
    );
  }

  /**
   * The TimingObject attached to the player.
   */
  get timingObject(): ITimingObject {
    return this._timingObject;
  }

  /**
   * Repeat count. A value of -1 means loop forever.
   */
  set repeat(value: number) {
    this._repeat = value;
  }

  /**
   * A flag to mute the player's MIDI output.
   */
  set mute(value: boolean) {
    this._mute = value;
    if (this._mute) {
      this.clear();
    }
  }

  /**
   * Playback speed. A value of 1 means normal speed.
   */
  set velocity(value: number) {
    this._velocity = value;
    if (this._midiPlayer.state === PlayerState.Playing) {
      this._midiPlayer.pause();
      this._timingObject.update({ velocity: this._velocity });
      this._play();
    }
  }

  /**
   * Implementation of IMidiOutput.send().
   *
   * @param data The MIDI event(s) to send
   * @param timestamp Timestamp of events onset in ms.
   *
   * We implement IMidiOutput here to capture any interesting events
   * such as MARKER events with Groove information.
   */
  send(data: number[] | Uint8Array, timestamp?: number) {
    if (this._mute) return;
    const event = parseMidiEvent(data);
    // Web MIDI does not accept meta messages.
    if ('channel' in event) {
      this._output.send(data, timestamp);
    }
  }

  /**
   * Implementation of IMidiOutput.clear().
   */
  clear() {
    this._output.clear?.();
  }

  protected async _play() {
    const synchronizeMidi = () => {
      if (this._midiPlayer.state !== PlayerState.Playing) return;

      // Lookup the current measure number by binary-searching the timemap.
      // TODO Optimize search by starting at current measure.
      const timestamp = this.position;
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

      // Update the cursors and listeners.
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
      this._timingObject.update({ position: timestamp });

      // Schedule next cursor movement.
      requestAnimationFrame(synchronizeMidi);
    };

    // Schedule first cursor movement.
    requestAnimationFrame(synchronizeMidi);

    // Activate the MIDI player.
    if (this._midiPlayer.state === PlayerState.Paused) {
      await this._midiPlayer.resume(this._velocity, this._repeat);
    } else {
      await this._midiPlayer.play(this._velocity, this._repeat);
    }
  }

  protected _handleTimingObjectChange(_event: Event) {
    // // Don't handle our internally-generated events.
    // if (this._timingObjectUpdating) {
    //   this._timingObjectUpdating = false;
    //   return;
    // }
    // // Handle externally-generated events.
    // const { velocity, position } = this.timingObject.query();
    // if (velocity === 0) {
    //   if (position === 0) {
    //     this.rewind();
    //   } else {
    //     this.pause();
    //   }
    // } else {
    //   if (this._midiPlayer.state !== PlayerState.Stopped) {
    //     this._midiPlayer.velocity = velocity;
    //     this._midiPlayer.position = position;
    //   }
    // }
  }

  protected static async _unroll(musicXml: string): Promise<string> {
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
