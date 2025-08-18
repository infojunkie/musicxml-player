import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import type { VerovioOptionsFixed, VerovioToolkitFixed } from './VerovioBase';
import { VerovioBase } from './VerovioBase';
import { assertIsDefined, atoab } from './helpers';

/**
 * Implementation of IMidiConverter that uses Verovio to convert a MusicXML file to MIDI and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertomidi and
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 */
export class VerovioConverter extends VerovioBase implements IMidiConverter {
  protected _vrv?: VerovioToolkitFixed;
  protected _timemap: MeasureTimemap = [];
  protected _midi?: ArrayBuffer;
  protected _options: VerovioOptionsFixed;

  constructor(options?: VerovioOptionsFixed) {
    super();
    this._options = {
      ...{
        expand: 'expansion-repeat',
        midiNoCue: true,
      },
      ...options,
    };
  }

  async initialize(musicXml: string): Promise<void> {
    // Create Verovio toolkit and load MusicXML.
    const VerovioModule = await createVerovioModule();
    this._vrv = <VerovioToolkitFixed>new VerovioToolkit(VerovioModule);
    this._vrv.setOptions(this._options);
    if (!this._vrv.loadData(musicXml)) {
      throw new Error(`[VerovioConverter.initialize] Failed to load MusicXML.`);
    }

    // Build timemap.
    this._timemap = VerovioBase._parseTimemap(
      this._vrv.renderToTimemap({ includeMeasures: true, includeRests: true })
    );

    // Render to MIDI.
    this._midi = atoab(this._vrv.renderToMIDI());
  }

  get midi(): ArrayBuffer {
    assertIsDefined(this._midi);
    return this._midi;
  }

  get timemap(): MeasureTimemap {
    return this._timemap;
  }

  get version(): string {
    return `verovio v${this._vrv?.getVersion() ?? 'Unknown'}`;
  }
}
