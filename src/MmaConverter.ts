import { parseArrayBuffer as parseMidiBuffer } from 'midi-json-parser';
import type {
  IMidiFile,
  IMidiMarkerEvent,
  IMidiSetTempoEvent,
} from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import { fetish } from './helpers';

/**
 * Implementation of IMidiConverter that queries the musicxml-mma API (@see https://github.com/infojunkie/musicxml-mma)
 * to convert a MusicXML to a MIDI file. It extracts the timemap contained within the MIDI file, expressed as MIDI marker events.
 */
export class MmaConverter implements IMidiConverter {
  private _version: any;
  private _midi: IMidiFile | null;
  private _timemap: MeasureTimemap;

  constructor(
    private _apiUri: string,
    private _parameters?: Record<string, string>,
  ) {
    this._version = null;
    this._midi = null;
    this._timemap = [];
  }

  async initialize(musicXml: string): Promise<void> {
    // First get the API version.
    this._version = await (await fetish(`${this._apiUri}`)).json();

    // Convert the score.
    const formData = new FormData();
    formData.append('musicXml', new Blob([musicXml], { type: 'text/xml' }));
    if (this._parameters) {
      for (const parameter in this._parameters) {
        formData.append(parameter, this._parameters[parameter]);
      }
    }
    const response = await fetish(`${this._apiUri}/convert`, {
      method: 'POST',
      body: formData,
    });
    this._midi = await parseMidiBuffer(await response.arrayBuffer());
    this._timemap = await MmaConverter.parseTimemap(this._midi);
  }

  get midi(): IMidiFile {
    if (!this._midi) throw 'TODO';
    return this._midi;
  }

  get timemap(): MeasureTimemap {
    return this._timemap;
  }

  get version(): string {
    if (!this._version) throw 'TODO';
    return `${this._version.name} v${this._version.version}`;
  }

  /**
   * Parse an IMidiFile into a timemap.
   */
  static parseTimemap(midi: IMidiFile): MeasureTimemap {
    if (!midi.tracks.length) throw 'TODO';

    const timemap: MeasureTimemap = [];
    let microsecondsPerQuarter = 500000; // 60,000,000 microseconds per minute / 120 beats per minute
    let offset = 0;
    midi.tracks[0].forEach((event) => {
      if ('setTempo' in event) {
        microsecondsPerQuarter = (<IMidiSetTempoEvent>event).setTempo
          .microsecondsPerQuarter;
      }
      offset += event.delta;
      if ('marker' in event) {
        const marker = (<IMidiMarkerEvent>event).marker.split(':');
        if (
          marker[0].localeCompare('Measure', undefined, {
            sensitivity: 'base',
          }) === 0
        ) {
          const measure = Number(marker[1]);
          const timestamp =
            Math.round(offset * (microsecondsPerQuarter / midi.division)) /
            1000;
          timemap.push({
            measure,
            timestamp,
          });
        }
      }
    });

    if (!timemap.length) {
      console.warn(
        `[MmaConverter.parseTimemap] Could not find any Measure:N marker message in the MIDI file.`,
      );
    }

    return timemap;
  }
}
