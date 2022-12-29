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

export type MeasureNumber = number;
export type MillisecsTimestamp = number;
export enum Renderer {
  OpenSheetMusicDisplay,
  Verovio,
}

export class Player {
  static async load(
    container: HTMLDivElement | string,
    musicXml: string,
    midiBuffer: ArrayBuffer,
    midiOutput: IMidiOutput | null,
    renderer: Renderer = Renderer.OpenSheetMusicDisplay,
  ): Promise<Player> {
    const midiJson = await parseMidiBuffer(midiBuffer);
    const sheetPlayback = Player.createSheetPlayback(renderer);
    const player = new Player(
      midiJson,
      midiOutput ?? new SoundFontOutput(midiJson),
      sheetPlayback,
    );
    await sheetPlayback.initialize(player, container, musicXml);
    return player;
  }

  private static createSheetPlayback(renderer: Renderer): ISheetPlayback {
    switch (renderer) {
      case Renderer.OpenSheetMusicDisplay:
        return new OpenSheetMusicDisplayPlayback();
      case Renderer.Verovio:
        return new VerovioPlayback();
      default:
        throw 'TODO';
    }
  }

  private mapMeasureToTimestamp: Map<MeasureNumber, MillisecsTimestamp[]>;
  private firstMeasureNumber: MeasureNumber;
  private midiPlayer: IMidiPlayer;
  private startTime: MillisecsTimestamp;
  private pauseTime: MillisecsTimestamp;
  private currentMeasureStartTime: MillisecsTimestamp;
  private currentMeasureNumber: MeasureNumber;
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
    this.mapMeasureToTimestamp = new Map();
    this.startTime = 0;
    this.pauseTime = 0;
    this.firstMeasureNumber = -1;
    this.currentMeasureNumber = -1;
    this.currentMeasureStartTime = 0;
    this.parseMidi();
  }

  move(measure: MeasureNumber, millisecs: MillisecsTimestamp) {
    if (typeof this.mapMeasureToTimestamp.get(measure) === 'undefined') {
      console.error(`Measure ${measure} not found.`);
      return;
    }
    const timestamp = this.mapMeasureToTimestamp.get(measure)![0] + millisecs;
    this.midiPlayer.seek(timestamp);
    this.currentMeasureNumber = measure;
    const now = performance.now();
    this.currentMeasureStartTime = now - millisecs;
    this.startTime = now - timestamp;
    this.pauseTime = now;
  }

  async play() {
    await this.playMidi();
  }

  async pause() {
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
          if (this.firstMeasureNumber === -1) {
            this.firstMeasureNumber = Number(marker[1]);
          }
          const measureNumber = Number(marker[1]) - this.firstMeasureNumber;
          const timestamp =
            offset * (microsecondsPerQuarter / this.midiJson.division / 1000);
          const timestamps =
            this.mapMeasureToTimestamp.get(measureNumber) || [];
          this.mapMeasureToTimestamp.set(
            measureNumber,
            timestamps.concat(timestamp),
          );
        }
      }
    });

    if (this.firstMeasureNumber === -1) {
      // TODO Warn or throw exception that the MIDI does not contain measure markers.
    }
  }

  private async playMidi() {
    const now = performance.now();
    if (this.midiPlayer.state === PlayerState.Paused || this.startTime !== 0) {
      this.startTime += now - this.pauseTime;
      this.currentMeasureStartTime += now - this.pauseTime;
    } else {
      this.startTime = now;
      this.currentMeasureNumber = 0;
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
            if (marker[0] === 'Measure') {
              this.currentMeasureNumber =
                Number(marker[1]) - this.firstMeasureNumber;
              this.currentMeasureStartTime = now;
            } else if (marker[0] === 'Groove') {
              // TODO Update listeners that the groove has changed.
            }
          }
        });
      this.sheetPlayback.seek(
        this.currentMeasureNumber,
        Math.max(0, now - this.currentMeasureStartTime),
      );

      // Schedule next cursor movement.
      lastTime = now;
      requestAnimationFrame(synchronizeMidi);
    };
    requestAnimationFrame(synchronizeMidi);

    if (this.midiPlayer.state === PlayerState.Paused) {
      await this.midiPlayer.resume();
    } else {
      await this.midiPlayer.play();
    }

    // Reset.
    if (this.midiPlayer.state !== PlayerState.Paused) {
      this.startTime = 0;
    }
  }
}
