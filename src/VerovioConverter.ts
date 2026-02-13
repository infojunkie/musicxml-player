import createVerovioModule from 'verovio/wasm';
import type {
  IMIDIConverter,
  MeasureTimemap,
} from './interfaces/IMIDIConverter';
import type { VerovioOptionsFixed, VerovioToolkitFixed } from './VerovioTypes';
import { VerovioConverterBase } from './VerovioConverterBase';
import { assertIsDefined, atoab } from './helpers';
import type { PlayerOptions } from './Player';
import { VerovioToolkit } from 'verovio/esm';

/**
 * Implementation of IMIDIConverter that uses Verovio to convert a MusicXML file to MIDI and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertomidi and
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 */
export class VerovioConverter
  extends VerovioConverterBase
  implements IMIDIConverter
{
  protected _vrv?: VerovioToolkitFixed;
  protected _timemap: MeasureTimemap = [];
  protected _midi?: ArrayBuffer;
  protected _vrvOptions: VerovioOptionsFixed;

  constructor(vrvOptions?: VerovioOptionsFixed) {
    super();
    this._vrvOptions = {
      ...{
        midiNoCue: true,
        xmlIdChecksum: true,
      },
      ...vrvOptions,
    };
  }

  async initialize(
    musicXml: string,
    _vrvOptions: Required<PlayerOptions>,
  ): Promise<void> {
    // Create Verovio toolkit and load MusicXML.
    const VerovioModule = await createVerovioModule();
    this._vrv = <VerovioToolkitFixed>new VerovioToolkit(VerovioModule);
    this._vrv.setOptions(this._vrvOptions);
    if (!this._vrv.loadData(musicXml)) {
      throw new Error(`[VerovioConverter.initialize] Failed to load MusicXML.`);
    }

    // Build timemap.
    this._timemap = VerovioConverterBase._parseTimemap(
      this._vrv.renderToTimemap({ includeMeasures: true, includeRests: true }),
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
