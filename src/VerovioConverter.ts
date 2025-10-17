import createVerovioModule from 'verovio/wasm';
import type {
  IMIDIConverter,
  MeasureTimemap,
} from './interfaces/IMIDIConverter';
import type { VerovioOptionsFixed, VerovioToolkitFixed } from './VerovioTypes';
import { VerovioConverterBase } from './VerovioConverterBase';
import {
  assertIsDefined,
  atoab,
  unrollMusicXml,
  parseMusicXmlTimemap,
} from './helpers';
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

  async initialize(
    musicXml: string,
    options: Required<PlayerOptions>,
  ): Promise<void> {
    // Create Verovio toolkit and load MusicXML.
    const VerovioModule = await createVerovioModule();
    this._vrv = <VerovioToolkitFixed>new VerovioToolkit(VerovioModule);
    this._vrv.setOptions(this._options);
    if (!this._vrv.loadData(musicXml)) {
      throw new Error(`[VerovioConverter.initialize] Failed to load MusicXML.`);
    }

    // Build timemap.
    // FIXME! Restore Verovio parsing when it's able to unroll a MusicXML score on its own.
    this._timemap = await parseMusicXmlTimemap(
      musicXml,
      options.timemapXslUri,
      options.xsltProcessor,
    );
    // this._timemap = VerovioConverterBase._parseTimemap(
    //   this._vrv.renderToTimemap({ includeMeasures: true, includeRests: true })
    // );

    // Unroll score and render to MIDI.
    // FIXME! No longer needed when Verovio is able to unroll a MusicXML score on its own.
    const unrolled = await unrollMusicXml(
      musicXml,
      options.unrollXslUri,
      options.xsltProcessor,
    );
    this._vrv.loadData(unrolled);
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
