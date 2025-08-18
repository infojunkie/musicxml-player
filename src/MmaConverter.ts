import { parseMidi } from 'midi-file'
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import { assertIsDefined, fetish } from './helpers';

/**
 * Implementation of IMidiConverter that queries the musicxml-midi API (@see https://github.com/infojunkie/musicxml-midi)
 * to convert a MusicXML to a MIDI file. It extracts the timemap contained within the MIDI file, expressed as MIDI marker events.
 */
export class MmaConverter implements IMidiConverter {
  protected _version?: {
    name: string;
    version: string;
  };
  protected _midi?: ArrayBuffer;
  protected _timemap?: MeasureTimemap;
  protected _uri;

  constructor(
    uri: string,
    protected _parameters?: Record<string, string>,
  ) {
    this._uri = uri.endsWith('/') ? uri.slice(0, -1) : uri;
  }

  async initialize(musicXml: string): Promise<void> {
    // First get the API version.
    this._version = await (await fetish(`${this._uri}/`)).json();

    // Convert the score.
    const formData = new FormData();
    formData.append('musicXml', new Blob([musicXml], { type: 'text/xml' }));
    if (this._parameters) {
      for (const parameter in this._parameters) {
        formData.append(parameter, this._parameters[parameter]);
      }
    }
    const response = await fetish(`${this._uri}/convert`, {
      method: 'POST',
      body: formData,
    });
    this._midi = await response.arrayBuffer();
    this._timemap = MmaConverter._parseTimemap(this._midi);
  }

  get midi(): ArrayBuffer {
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
  protected static _parseTimemap(buffer: ArrayBuffer): MeasureTimemap {
    const timemap: MeasureTimemap = [];
    const midi = parseMidi(new Uint8Array(buffer));
    let microsecondsPerQuarter = 500000; // 60,000,000 microseconds per minute / 120 beats per minute
    let offset = 0;
    midi.tracks[0].forEach((event) => {
      if (event.type === 'setTempo') {
        microsecondsPerQuarter = Number(event.microsecondsPerBeat);
      }
      offset += Number(event.deltaTime);
      if (event.type === 'marker') {
        const marker = event.text.split(':');
        if (
          marker[0].localeCompare('Measure', undefined, {
            sensitivity: 'base',
          }) === 0
        ) {
          const measure = Number(marker[1]);
          const duration = Number(marker[2]);
          const timestamp = Math.round(offset * (microsecondsPerQuarter / (midi.header.ticksPerBeat ?? 24))) / 1000;
          timemap.push({
            measure,
            timestamp,
            duration
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
