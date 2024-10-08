import { parseArrayBuffer as parseMidiBuffer } from 'midi-json-parser';
import type {
  IMidiFile,
  IMidiMarkerEvent,
  IMidiSetTempoEvent,
} from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import { assertIsDefined, fetish } from './helpers';

/**
 * Implementation of IMidiConverter that queries the musicxml-midi API (@see https://github.com/infojunkie/musicxml-midi)
 * to convert a MusicXML to a MIDI file. It extracts the timemap contained within the MIDI file, expressed as MIDI marker events.
 */
export class MmaConverter implements IMidiConverter {
  private _version?: {
    name: string,
    version: string
  };
  private _midi?: IMidiFile;
  private _timemap?: MeasureTimemap;

  constructor(
    private _apiUri: string,
    private _parameters?: Record<string, string>,
  ) {}

  async initialize(
    _container: HTMLElement,
    musicXml: string,
  ): Promise<void> {
    // First get the API version.
    this._version = await (await fetish(`${this._apiUri}/`)).json();

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
    this._timemap = await MmaConverter._parseTimemap(this._midi);
  }

  get midi(): IMidiFile {
    assertIsDefined(this._midi);
    return this._midi;
  }

  get timemap(): MeasureTimemap {
    assertIsDefined(this._timemap);
    return this._timemap;
  }

  get version(): string {
    return `MmaConverter v${this._version?.version ?? 'Unknown'}`;
  }

  /**
   * Parse an IMidiFile into a timemap.
   */
  private static _parseTimemap(midi: IMidiFile): MeasureTimemap {
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
          timemap.push({
            measure: Number(marker[1]),
            timestamp:
              Math.round(offset * (microsecondsPerQuarter / midi.division)) /
              1000,
            duration: Number(marker[2]),
          });
        }
      }
    });

    if (!timemap.length) {
      console.warn(
        `[MmaConverter._parseTimemap] Could not find any Measure:N marker message in the MIDI file.`,
      );
    }

    return timemap;
  }
}
