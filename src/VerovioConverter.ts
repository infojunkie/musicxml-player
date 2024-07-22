import { parseArrayBuffer as parseMidiBuffer } from 'midi-json-parser';
import type { IMidiFile } from 'midi-json-parser-worker';
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import { VerovioOptions } from 'verovio';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import type { TimemapEntryFixed } from './VerovioRenderer';

/**
 * Implementation of IMidiConverter that uses the Verovio library to convert a MusicXML file to MIDI and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertomidi and
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 */
export class VerovioConverter implements IMidiConverter {
  private _vrv: VerovioToolkit | null;
  private _timemap: MeasureTimemap;
  private _midi: IMidiFile | null;
  private _options: VerovioOptions;

  constructor(options?: VerovioOptions) {
    this._vrv = null;
    this._timemap = [];
    this._midi = null;
    this._options = {
      ...{
        expand: 'expansion-repeat',
        midiNoCue: true,
      },
      ...options,
    };
  }

  async initialize(musicXml: string): Promise<void> {
    const VerovioModule = await createVerovioModule();
    this._vrv = new VerovioToolkit(VerovioModule);
    this._vrv.setOptions(this._options);
    if (!this._vrv.loadData(musicXml)) {
      throw 'TODO';
    }

    // Build timemap.
    if (!this._timemap.length) {
      let tstamp = 0;
      this._vrv
        .renderToTimemap({ includeMeasures: true, includeRests: true })
        .forEach((e) => {
          const event = <TimemapEntryFixed>e;

          // If starting a measure, add it to the timemap.
          if ('measureOn' in event) {
            const i = this._timemap.length;
            if (i > 0) {
              this._timemap[i - 1].duration =
                event.tstamp - this._timemap[i - 1].timestamp;
            }
            this._timemap.push({
              measure: i,
              timestamp: event.tstamp,
              duration: 0,
            });
          }

          // Find the duration of the last measure.
          // Calculate the max tstamp and compute the last measure duration based on that.
          tstamp = Math.max(tstamp, event.tstamp);
        });
      this._timemap.last().duration = tstamp - this._timemap.last().timestamp;
    }

    // Render to MIDI.
    this._midi = await parseMidiBuffer(
      VerovioConverter._base64ToArrayBuffer(this._vrv.renderToMIDI()),
    );
  }

  get midi(): IMidiFile {
    if (!this._midi) throw 'TODO';
    return this._midi;
  }

  get timemap(): MeasureTimemap {
    return this._timemap;
  }

  get version(): string {
    if (!this._vrv) throw 'TODO';
    return `verovio v${this._vrv.getVersion()}`;
  }

  private static _base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
