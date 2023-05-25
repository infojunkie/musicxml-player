import { parseArrayBuffer as parseMidiBuffer } from 'midi-json-parser';
import type { IMidiFile } from 'midi-json-parser-worker';
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import { VerovioOptions } from 'verovio';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import type { MeasureIndex } from './Player';
import type { TimeMapEntryFixed } from './VerovioRenderer';
import SaxonJS from './saxon-js/SaxonJS2.rt';

const XSL_UNROLL =
  'https://raw.githubusercontent.com/infojunkie/musicxml-mma/main/musicxml-unroll.sef.json';
const XSL_TIMEMAP =
  'https://raw.githubusercontent.com/infojunkie/musicxml-mma/main/musicxml-timemap.sef.json';

/**
 * Implementation of IMidiConverter that uses the Verovio library to convert a MusicXML file to MIDI and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertomidi and
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 */
export class VerovioConverter implements IMidiConverter {
  private _vrv: VerovioToolkit | null;
  private _musicXml: string;
  private _timemap: MeasureTimemap;
  private _midi: IMidiFile | null;
  private _options: VerovioOptions;

  constructor(private _unroll: boolean = false, options?: VerovioOptions) {
    this._vrv = null;
    this._musicXml = '';
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

    // If unrolling, do it now.
    this._musicXml = musicXml;
    if (this._unroll) {
      const { musicXml, timemap } = await VerovioConverter._unroll(
        this._musicXml,
      );
      this._musicXml = musicXml;
      this._timemap = timemap;
    }
    if (!this._vrv.loadData(this._musicXml)) {
      throw 'TODO';
    }

    // Fallback to use Verovio's timemap.
    if (!this._timemap.length) {
      let measureIndex: MeasureIndex = 0;
      this._vrv.renderToTimemap({ includeMeasures: true }).forEach((e) => {
        const event = <TimeMapEntryFixed>e;
        if ('measureOn' in event) {
          this._timemap.push({
            measure: measureIndex++,
            timestamp: event.tstamp,
          });
        }
      });
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

  private static async _unroll(musicXml: string): Promise<{
    musicXml: string;
    timemap: MeasureTimemap;
  }> {
    try {
      const unroll = await SaxonJS.transform(
        {
          stylesheetLocation: XSL_UNROLL,
          sourceText: musicXml,
          destination: 'serialized',
        },
        'async',
      );
      const xml = unroll.principalResult;
      const timemap = await SaxonJS.transform(
        {
          stylesheetLocation: XSL_TIMEMAP,
          sourceText: musicXml,
          destination: 'serialized',
        },
        'async',
      );
      return {
        musicXml: xml,
        timemap: JSON.parse(timemap.principalResult),
      };
    } catch (error) {
      console.warn(`[VerovioConverter._unroll] ${error}`);
    }
    return {
      musicXml,
      timemap: [],
    };
  }
}
