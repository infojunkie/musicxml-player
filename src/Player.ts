import { BasicMIDI } from 'spessasynth_core';
import { WorkletSynthesizer as Synthetizer, Sequencer } from 'spessasynth_lib';
import { midiMessageTypes } from 'spessasynth_core';
import {
  binarySearch,
  parseMusicXml,
  MusicXmlParseResult,
  fetish,
  debounce
} from './helpers';
import type { IMIDIConverter } from './IMIDIConverter';
import type { ISheetRenderer } from './ISheetRenderer';
import SaxonJS from './saxon-js/SaxonJS3.rt';
import pkg from '../package.json';
import pkg_lock from '../package-lock.json';

const XSL_UNROLL =
  'https://raw.githubusercontent.com/infojunkie/musicxml-midi/main/build/unroll.sef.json';

const DEBOUNCE_THROTTLE = 100;

export type MeasureIndex = number;
export type MillisecsTimestamp = number;

export enum PlayerState {
  Stopped = 0,
  Playing,
  Paused
}

/**
 * A structure holding the Player creation options.
 */
export interface PlayerOptions {
  /**
   * The HTML element containing the sheet, as DOM element object or its id.
   */
  container: HTMLDivElement | string;
  /**
   * The input MusicXML score, as text string or ArrayBuffer (e.g. for compressed MXL).
   */
  musicXml: ArrayBuffer | string;
  /**
   * An instance of ISheetRenderer interface used to render the score.
   */
  renderer: ISheetRenderer;
  /**
   * An instance of IMIDIConverter interface used to convert the score to MIDI.
   */
  converter: IMIDIConverter;
  /**
   * An instance of the MIDI output to send the note events.
   * Optional, default: local Web Audio synthesizer
   */
  output?: WebMidi.MIDIOutput | null;
  /**
   * URL of soundfont for local Web Audio synthesizer.
   * Optional, default: https://spessasus.github.io/SpessaSynth/soundfonts/GeneralUserGS.sf3
   */
  soundfontUri?: string;
  /**
   * URL of MusicXML => Timemap XSL transformation.
   * Optional, default: https://raw.githubusercontent.com/infojunkie/musicxml-midi/main/build/timemap.sef.json
   * Note that the code expects to find the file unroll.xsl / unroll.sef.json at the same path.
   */
  timemapXslUri?: string;
  /**
   * A flag to unroll the score before displaying it and playing it.
   * Optional, default: false
   */
  unroll?: boolean;
  /**
   * A flag to mute the player's MIDI output.
   * Optional, default: false
   * Can also be changed dynamically via Player.mute attribute.
   */
  mute?: boolean;
  /**
   * Repeat count. A value of Infinity means loop forever.
   * Optional, default: 1
   * Can also be changed dynamically via Player.repeat attribute.
   */
  repeat?: number;
  /**
   * Playback speed. A value of 1 means normal speed.
   * Optional, default: 1
   * Can also be changed dynamically via Player.velocity attribute.
   */
  velocity?: number;
  /**
   * A flag to render the score as a single horizontal system.
   * Optional, default: false
   */
  horizontal?: boolean;
  /**
   * A flag to center the browser window around the cursor.
   * Optional, default: true
   */
  followCursor?: boolean;
}

const DEFAULT_PLAYER_OPTIONS = {
  soundfontUri: 'https://spessasus.github.io/SpessaSynth/soundfonts/GeneralUserGS.sf3',
  timemapXslUri: 'https://raw.githubusercontent.com/infojunkie/musicxml-midi/main/build/timemap.sef.json',
  output: null,
  unroll: false,
  mute: false,
  repeat: 1,
  velocity: 1,
  horizontal: false,
  followCursor: true,
}

export class Player {
  /**
   * Create a new instance of the player.
   *
   * @param options Player options.
   * @returns A new instance of the player, ready to play.
   * @throws Error exception with various error messages.
   */
  static async create(_options: PlayerOptions): Promise<Player> {
    // Fill in the default option values.
    const options: Required<PlayerOptions> = {
      ...DEFAULT_PLAYER_OPTIONS,
      ..._options,
    };

    // Create the inner sheet element.
    const container =
      typeof options.container === 'string'
        ? document.getElementById(options.container)
        : options.container;
    if (!container) {
      throw new Error('[Player.load] Failed to find container element.');
    }
    const sheet = document.createElement('div');
    sheet.className = 'player-sheet';
    container.appendChild(sheet);

    // Parse the incoming MusicXML and unroll it if needed.
    try {
      const parseResult = await parseMusicXml(options.musicXml, {
        title: '//work/work-title/text()',
        version: '//score-partwise/@version',
      });
      let musicXml = parseResult.musicXml;
      if (options.unroll) {
        musicXml = await Player._unrollMusicXml(musicXml);
      }

      // Create the synth element.
      const context = new AudioContext();
      //await context.audioWorklet.addModule(new URL('helpers/spessasynth_processor.ts', import.meta.url));
      await context.audioWorklet.addModule(new URL('spessasynth_processor.js', import.meta.url));
      const soundfont = await (await fetish(options.soundfontUri)).arrayBuffer();
      const synth = new Synthetizer(context);
      synth.connect(context.destination);
      await synth.soundBankManager.addSoundBank(soundfont, "main");

      // Initialize the various objects.
      // It's too bad that constructors cannot be made async because that would simplify the code.
      await options.converter.initialize(musicXml, options);
      await options.renderer.initialize(sheet, musicXml, options);

      // Finally, create the player instance.
      return new Player(options, sheet, parseResult, musicXml, synth, context);
    } catch (error) {
      console.error(`[Player.create] ${error}`);
      throw error;
    }
  }

  protected _sequencer: Sequencer;
  protected _midi: BasicMIDI;
  protected _observer: ResizeObserver;
  protected _duration: number;
  protected _state: PlayerState;
  protected _abortController: AbortController;

  protected constructor(
    protected _options: Required<PlayerOptions>,
    protected _sheet: HTMLElement,
    protected _parseResult: MusicXmlParseResult,
    protected _musicXml: string,
    protected _synthesizer: Synthetizer,
    protected _context: AudioContext
  ) {
    // Inform the renderer that we're here.
    this._options.renderer.player = this;

    // Create the MIDI player.
    this._state = PlayerState.Stopped;
    this._midi = Player._adjustMidiDuration(this._options.converter);
    this._duration = this._midi.duration * 1000;
    this._sequencer = new Sequencer(this._synthesizer);
    if (this._options.output) {
      this._sequencer.connectMIDIOutput(this._options.output);
    }
    this._sequencer.loadNewSongList([{ binary: this._midi.writeMIDI() }]);

    // Initialize the playback options.
    this.mute = this._options.mute;
    this._sequencer.playbackRate = this._options.velocity;
    this._sequencer.loopCount = this._options.repeat;

    // Handling DOM events.
    this._observer = new ResizeObserver(debounce(() => {
      this._options.renderer.onResize();
    }, DEBOUNCE_THROTTLE));
    this._observer.observe(this._sheet);
    this._abortController = new AbortController();
    window.addEventListener('scroll', debounce((event) => {
      this._options.renderer.onEvent('scroll', event);
    }, 0), { signal: this._abortController.signal });
  }

  /**
   * Destroy the instance by freeing all resources and disconnecting observers.
   */
  destroy(): void {
    // Never fail during destruction.
    try {
      this._sheet?.remove();
      this._observer?.disconnect();
      this._sequencer?.pause();
      this._options?.renderer?.destroy();
      this._abortController?.abort();
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
      this._sequencer.currentTime = (entry.timestamp + measureOffset - 1) / 1000;
    }

    // Set the cursor position.
    this._options.renderer.moveTo(measureIndex, measureStart, measureOffset);
  }

  /**
   * Start playback.
   */
  play() {
    const synchronizeMidi = () => {
      if (this.state !== PlayerState.Playing) return;

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

      // Schedule next cursor movement.
      requestAnimationFrame(synchronizeMidi);
    };

    // Activate the MIDI player.
    this._context.resume().then(() => {
      this._state = PlayerState.Playing;
      requestAnimationFrame(synchronizeMidi);
      this._sequencer.play();
    })
  }

  /**
   * Pause playback.
   */
  pause() {
    this._state = PlayerState.Paused;
    this._sequencer.pause();
  }

  /**
   * Stop playback and rewind to start.
   */
  rewind() {
    this._sequencer.currentTime = 0;
    this._options.renderer.moveTo(0, 0, 0);
  }

  /**
   * The version numbers of the player components.
   */
  get version(): Record<string, string> {
    return {
      player: `${pkg.name} v${pkg.version}`,
      renderer: this._options.renderer.version,
      converter: this._options.converter.version,
      sequencer: `spessasynth_lib v${pkg_lock.packages['node_modules/spessasynth_lib'].version}`,
    };
  }

  /**
   * The MusicXML score.
   */
  get musicXml(): string {
    return this._musicXml;
  }

  /**
   * The MIDI buffer.
   */
  get midi(): ArrayBuffer {
    return this._midi.writeMIDI();
  }

  /**
   * The player state.
   */
  get state(): PlayerState {
    return this._state;
  }

  /**
   * The score title (can be blank).
   */
  get title(): string {
    return this._parseResult.queries['title'].result ?? '';
  }

  /**
   * The duration of the score/MIDI file (ms).
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
      Math.min(this._sequencer.currentTime * 1000, this._duration - 1),
    );
  }

  /**
   * Repeat count. A value of Infinity means loop forever.
   */
  set repeat(value: number) {
    this._sequencer.loopCount = value;
  }

  /**
   * A flag to mute the player's MIDI output.
   */
  set mute(value: boolean) {
    for (let i=0; i<this._synthesizer.channelsAmount; i++) {
      this._synthesizer.muteChannel(i, value);
    }
  }

  /**
   * Playback speed. A value of 1 means normal speed.
   */
  set velocity(value: number) {
    this._sequencer.playbackRate = value;
  }

  /**
   * MIDI output. A value of undefined means internal synth.
   */
  set output(output: WebMidi.MIDIOutput | undefined) {
    this._sequencer.connectMIDIOutput(output);
  }

  /**
   * Unroll the score by expanding all repeats and jumps into a linear score.
   */
  protected static async _unrollMusicXml(musicXml: string): Promise<string> {
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
      console.error(`[Player._unrollMusicXml] ${error}`);
    }
    return musicXml;
  }

  /**
   * Adjust the incoming MIDI file by inserting a no-op CC message at the end of the last measure
   * based on the durations reported by the timemap. This forces the MIDI player to end on the
   * measure boundary.
   *
   * @see https://github.com/spessasus/SpessaSynth/discussions/176
   */
  protected static _adjustMidiDuration(converter: IMIDIConverter): BasicMIDI {
    const midi = BasicMIDI.fromArrayBuffer(converter.midi);
    const duration = converter.timemap.reduce((duration, entry) => duration + entry.duration, 0);
    const ticks = Math.round(duration / (60000 / midi.tempoChanges[0].tempo / midi.timeDivision));
    midi.tracks[0].pushEvent({
      ticks,
      statusByte: midiMessageTypes.controllerChange,
      data: new Uint8Array([50, 0]),
    });
    midi.flush();
    return midi;
  }
}
