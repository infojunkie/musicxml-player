import { parseArrayBuffer as parseMidiBuffer } from 'midi-json-parser';
import type {
  IMidiFile,
  IMidiMarkerEvent,
  IMidiSetTempoEvent,
} from 'midi-json-parser-worker';
import type { IMidiConverter } from './IMidiConverter';
import type { MeasureTimemap } from './Player';
import { fetchex } from './helpers';

export class MmaConverter implements IMidiConverter {
  private _version: any;
  private _midi: IMidiFile | null;
  private _timemap: MeasureTimemap;

  constructor(private apiUri: string) {
    this._version = null;
    this._midi = null;
    this._timemap = [];
  }

  async initialize(musicXml: string): Promise<void> {
    // First get the API version.
    this._version = await (await fetch(`${this.apiUri}`)).json();

    // Convert the score.
    const formData = new FormData();
    formData.append('musicXml', new Blob([musicXml], { type: 'text/xml' }));
    const response = await fetchex(`${this.apiUri}/convert`, {
      method: 'POST',
      body: formData,
    });
    this._midi = await parseMidiBuffer(await response.arrayBuffer());
    this._timemap = await MmaConverter._parse(this._midi);
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

  private static async _parse(midi: IMidiFile): Promise<MeasureTimemap> {
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
          const measureIndex = Number(marker[1]);
          const timestamp =
            offset * (microsecondsPerQuarter / midi.division / 1000);
          const timestamps = timemap[measureIndex] || [];
          timemap[measureIndex] = timestamps.concat(timestamp);
        }
      }
    });

    return timemap;
  }
}
