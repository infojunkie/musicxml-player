import type { ISheetRenderer } from './ISheetRenderer';
import type { IMidiConverter } from './IMidiConverter';
import type { IMidiMarkerEvent } from 'midi-json-parser-worker';
import {
  create as createMidiPlayer,
  IMidiOutput,
  IMidiPlayer,
  PlayerState,
} from 'midi-player';
import { MidiFileSlicer } from 'midi-file-slicer';
import { SoundFontOutput } from './SoundFontOutput';
import pkg from '../package.json';

export type MeasureIndex = number;
export type MillisecsTimestamp = number;

export interface PlayerOptions {
  container: HTMLDivElement | string;
  musicXml: string;
  renderer: ISheetRenderer;
  converter: IMidiConverter;
  output?: IMidiOutput;
}

export class Player {
  static async load(options: PlayerOptions): Promise<Player> {
    await options.converter.initialize(options.musicXml);
    const output = options.output ?? new SoundFontOutput(options.converter.midi);
    const player = new Player(
      output,
      options.renderer,
      options.converter,
    );
    await options.renderer.initialize(
      player,
      options.container,
      options.musicXml,
    );
    return player;
  }

  private midiFileSlicer: MidiFileSlicer;
  private _midiPlayer: IMidiPlayer;
  private _startTime: MillisecsTimestamp;
  private _pauseTime: MillisecsTimestamp;
  private _currentMeasureStartTime: MillisecsTimestamp;
  private _currentMeasureIndex: MeasureIndex;
  private _timemapMeasureToTimestamp: Array<MillisecsTimestamp>;

  private constructor(
    private output: IMidiOutput,
    private renderer: ISheetRenderer,
    private converter: IMidiConverter,
  ) {
    this.midiFileSlicer = new MidiFileSlicer({ json: this.converter.midi });
    this._midiPlayer = createMidiPlayer({
      json: this.converter.midi,
      midiOutput: this.output,
    });
    this._startTime = 0;
    this._pauseTime = 0;
    this._currentMeasureIndex = 0;
    this._currentMeasureStartTime = 0;

    // Build specialized timemaps for faster lookup.
    this._timemapMeasureToTimestamp = [];
    this.converter.timemap.forEach((entry) => {
      if (typeof this._timemapMeasureToTimestamp[entry.measure] === 'undefined') {
        this._timemapMeasureToTimestamp[entry.measure] = entry.timestamp;
      }
    });
  }

  moveToMeasure(measure: MeasureIndex, offset: MillisecsTimestamp) {
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
    this.renderer.seek(0, 0);
    this._startTime = 0;
  }

  get version(): Record<string, string> {
    return {
      player: `${pkg.name} v${pkg.version}`,
      renderer: this.renderer.version,
      converter: this.converter.version,
    };
  }

  private async _play() {
    const now = performance.now();
    if (this._midiPlayer.state === PlayerState.Paused || this._startTime !== 0) {
      this._startTime += now - this._pauseTime;
      this._currentMeasureStartTime += now - this._pauseTime;
    } else {
      this._startTime = now;
      this._currentMeasureIndex = 0;
      this._currentMeasureStartTime = now;
    }

    let lastTime = now;
    const synchronizeMidi = (now: number) => {
      if (this._midiPlayer.state !== PlayerState.Playing) return;

      this.midiFileSlicer
      .slice(lastTime - this._startTime, now - this._startTime)
      .forEach((event) => {
        if ('marker' in event.event) {
          const marker = (<IMidiMarkerEvent>event.event).marker.split(':');
          if (
            marker[0].localeCompare('Measure', undefined, {
              sensitivity: 'base',
            }) === 0
          ) {
            this._currentMeasureIndex = Number(marker[1]);
            this._currentMeasureStartTime = now;
          } else if (
            marker[0].localeCompare('Groove', undefined, {
              sensitivity: 'base',
            }) === 0
          ) {
            // TODO Update listeners that the groove has changed.
          }
        }
      });
      this.renderer.seek(
        this._currentMeasureIndex,
        Math.max(0, now - this._currentMeasureStartTime),
      );

      // Schedule next cursor movement.
      lastTime = now;
      requestAnimationFrame(synchronizeMidi);
    };

    // Schedule first cursor movement.
    lastTime = now;
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
