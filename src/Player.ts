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
export type MeasureTimemap = Array<MillisecsTimestamp[]>;

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

  private midiPlayer: IMidiPlayer;
  private startTime: MillisecsTimestamp;
  private pauseTime: MillisecsTimestamp;
  private currentMeasureStartTime: MillisecsTimestamp;
  private currentMeasureIndex: MeasureIndex;
  private midiFileSlicer: MidiFileSlicer;

  private constructor(
    private output: IMidiOutput,
    private renderer: ISheetRenderer,
    private converter: IMidiConverter,
  ) {
    this.midiPlayer = createMidiPlayer({
      json: this.converter.midi,
      midiOutput: this.output,
    });
    this.midiFileSlicer = new MidiFileSlicer({ json: this.converter.midi });
    this.startTime = 0;
    this.pauseTime = 0;
    this.currentMeasureIndex = 0;
    this.currentMeasureStartTime = 0;
  }

  moveToMeasure(measure: MeasureIndex, millisecs: MillisecsTimestamp) {
    const timestamp = this.converter.timemap[measure][0] + millisecs;
    this.midiPlayer.seek(timestamp);
    this.currentMeasureIndex = measure;
    const now = performance.now();
    this.currentMeasureStartTime = now - millisecs;
    this.startTime = now - timestamp;
    this.pauseTime = now;
  }

  async play() {
    if (this.midiPlayer.state === PlayerState.Playing) return;
    await this._play();
  }

  async pause() {
    if (this.midiPlayer.state !== PlayerState.Playing) return;
    this.midiPlayer.pause();
    this.pauseTime = performance.now();
  }

  async rewind() {
    this.midiPlayer.stop();
    this.renderer.seek(0, 0);
    this.startTime = 0;
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
    if (this.midiPlayer.state === PlayerState.Paused || this.startTime !== 0) {
      this.startTime += now - this.pauseTime;
      this.currentMeasureStartTime += now - this.pauseTime;
    } else {
      this.startTime = now;
      this.currentMeasureIndex = 0;
      this.currentMeasureStartTime = now;
    }

    let lastTime = now;
    const synchronizeMidi = (now: number) => {
      if (this.midiPlayer.state !== PlayerState.Playing) return;

      this.midiFileSlicer
      .slice(lastTime - this.startTime, now - this.startTime)
      .forEach((event) => {
        if ('marker' in event.event) {
          const marker = (<IMidiMarkerEvent>event.event).marker.split(':');
          if (
            marker[0].localeCompare('Measure', undefined, {
              sensitivity: 'base',
            }) === 0
          ) {
            this.currentMeasureIndex = Number(marker[1]);
            this.currentMeasureStartTime = now;
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
        this.currentMeasureIndex,
        Math.max(0, now - this.currentMeasureStartTime),
      );

      // Schedule next cursor movement.
      lastTime = now;
      requestAnimationFrame(synchronizeMidi);
    };

    // Schedule first cursor movement.
    lastTime = now;
    requestAnimationFrame(synchronizeMidi);

    // Activate the MIDI player.
    if (this.midiPlayer.state === PlayerState.Paused) {
      await this.midiPlayer.resume();
    } else {
      await this.midiPlayer.play();
    }

    // Reset when done.
    if (this.midiPlayer.state !== PlayerState.Paused) {
      this.startTime = 0;
    }
  }
}
