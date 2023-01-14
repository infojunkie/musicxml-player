import type { ISheetPlayback } from './ISheetPlayback';
import { OpenSheetMusicDisplayPlayback } from './OpenSheetMusicDisplayPlayback';
import { VerovioPlayback } from './VerovioPlayback';
import { parseArrayBuffer as parseMidiBuffer } from 'midi-json-parser';
import type {
  IMidiFile,
  IMidiSetTempoEvent,
  IMidiMarkerEvent,
} from 'midi-json-parser-worker';
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
export enum SheetRenderer {
  OpenSheetMusicDisplay,
  Verovio,
}

export interface PlayerOptions {
  container: HTMLDivElement | string;
  musicXml: string;
  renderer: SheetRenderer;
  midiBuffer: ArrayBuffer;
  midiOutput?: IMidiOutput;
}

export class Player {
  static async load(options: PlayerOptions): Promise<Player> {
    const midiJson = await parseMidiBuffer(options.midiBuffer);
    const midiOutput = options.midiOutput ?? new SoundFontOutput(midiJson);
    const sheetPlayback = Player.createSheetPlayback(options.renderer);
    const player = new Player(midiJson, midiOutput, sheetPlayback);
    await sheetPlayback.initialize(player, options.container, options.musicXml);
    return player;
  }

  static createSheetPlayback(renderer: SheetRenderer): ISheetPlayback {
    switch (renderer) {
      case SheetRenderer.OpenSheetMusicDisplay:
        return new OpenSheetMusicDisplayPlayback();
      case SheetRenderer.Verovio:
        return new VerovioPlayback();
      default:
        throw 'TODO';
    }
  }

  private mapMeasureToTimestamp: Array<MillisecsTimestamp[]>;
  private midiPlayer: IMidiPlayer;
  private startTime: MillisecsTimestamp;
  private pauseTime: MillisecsTimestamp;
  private currentMeasureStartTime: MillisecsTimestamp;
  private currentMeasureIndex: MeasureIndex;
  private midiFileSlicer: MidiFileSlicer;

  private constructor(
    private midiJson: IMidiFile,
    private midiOutput: IMidiOutput,
    private sheetPlayback: ISheetPlayback,
  ) {
    this.midiPlayer = createMidiPlayer({
      json: this.midiJson,
      midiOutput: this.midiOutput,
    });
    this.midiFileSlicer = new MidiFileSlicer({ json: this.midiJson });
    this.mapMeasureToTimestamp = [];
    this.startTime = 0;
    this.pauseTime = 0;
    this.currentMeasureIndex = 0;
    this.currentMeasureStartTime = 0;
    this.parseMidi();
  }

  move(measure: MeasureIndex, millisecs: MillisecsTimestamp) {
    const timestamp = this.mapMeasureToTimestamp[measure][0] + millisecs;
    this.midiPlayer.seek(timestamp);
    this.currentMeasureIndex = measure;
    const now = performance.now();
    this.currentMeasureStartTime = now - millisecs;
    this.startTime = now - timestamp;
    this.pauseTime = now;
  }

  async play() {
    if (this.midiPlayer.state === PlayerState.Playing) return;
    await this.playMidi();
  }

  async pause() {
    if (this.midiPlayer.state !== PlayerState.Playing) return;
    this.midiPlayer.pause();
    this.pauseTime = performance.now();
  }

  async rewind() {
    this.midiPlayer.stop();
    this.sheetPlayback.seek(0, 0);
    this.startTime = 0;
  }

  version() {
    return {
      player: `${pkg.name} v${pkg.version}`,
      renderer: this.sheetPlayback.version(),
    };
  }

  /**
   * Parse the MIDI file to construct a map linking measures to time offsets.
   */
  private parseMidi() {
    if (!this.midiJson.tracks.length) {
      // TODO Warn or throw exception that there are no MIDI tracks.
    }

    let microsecondsPerQuarter = 500000; // 60,000,000 microseconds per minute / 120 beats per minute
    let offset = 0;
    this.midiJson.tracks[0]!.forEach((event) => {
      if ('setTempo' in event) {
        microsecondsPerQuarter = (<IMidiSetTempoEvent>event).setTempo
          .microsecondsPerQuarter;
      }
      offset += event.delta;
      if ('marker' in event) {
        const marker = (<IMidiMarkerEvent>event).marker.split(':');
        if (marker[0] === 'Measure') {
          const measureIndex = Number(marker[1]);
          const timestamp =
            offset * (microsecondsPerQuarter / this.midiJson.division / 1000);
          const timestamps = this.mapMeasureToTimestamp[measureIndex] || [];
          this.mapMeasureToTimestamp[measureIndex] =
            timestamps.concat(timestamp);
        }
      }
    });
  }

  private async playMidi() {
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
                sensitivity: 'accent',
              }) === 0
            ) {
              this.currentMeasureIndex = Number(marker[1]);
              this.currentMeasureStartTime = now;
            } else if (
              marker[0].localeCompare('Groove', undefined, {
                sensitivity: 'accent',
              }) === 0
            ) {
              // TODO Update listeners that the groove has changed.
            }
          }
        });
      this.sheetPlayback.seek(
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
