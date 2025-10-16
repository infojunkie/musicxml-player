import pkg from '../package.json';
import type { IMIDIConverter, MeasureTimemap } from './interfaces/IMIDIConverter';
import type { TimeMapEntryFixed } from './VerovioTypes';
import { PlayerOptions } from './Player';
import { SaxonJSProcessor } from './SaxonJSProcessor';
import { VerovioConverterBase } from './VerovioConverterBase';
import { assertIsDefined, fetish, parseMusicXmlTimemap } from './helpers';
import type { IXSLTProcessor } from './interfaces/IXSLTProcessor';

/**
 * Implementation of IMIDIConverter that uses statically-rendered Verovio assets:
 * - MIDI file as obtained by `verovio --xml-id-checksum -t midi /path/to/score.musicxml`
 * - Timemap JSON file as obtained by `verovio --xml-id-checksum -t timemap --timemap-options '{ "includeMeasures": true, "includeRests": true }' /path/to/score.musicxml`
 */
export class VerovioStaticConverter
  extends VerovioConverterBase
  implements IMIDIConverter {
  protected _timemap?: MeasureTimemap;
  protected _midi?: ArrayBuffer;
  protected _xsltProcessor: IXSLTProcessor;

  constructor(
    protected _midiOrUri: ArrayBuffer | string,
    protected _timemapOrUri?: TimeMapEntryFixed[] | string,
    xsltProcessor?: IXSLTProcessor,
  ) {
    super();
    this._xsltProcessor = xsltProcessor || new SaxonJSProcessor();
  }

  async initialize(musicXml: string, options: Required<PlayerOptions>) {
    this._midi =
      typeof this._midiOrUri === 'string'
        ? await (await fetish(this._midiOrUri)).arrayBuffer()
        : this._midiOrUri;
    this._timemap =
      typeof this._timemapOrUri === 'undefined'
        ? await parseMusicXmlTimemap(
          musicXml,
          options.timemapXslUri,
          options.xsltProcessor,
        )
        : typeof this._timemapOrUri === 'string'
          ? VerovioConverterBase._parseTimemap(
            await (await fetish(this._timemapOrUri)).json(),
          )
          : VerovioConverterBase._parseTimemap(this._timemapOrUri);
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
    return `${pkg.name}/VerovioStaticConverter v${pkg.version}`;
  }
}
