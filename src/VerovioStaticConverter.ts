import type { IMIDIConverter, MeasureTimemap } from './IMIDIConverter';
import type { TimeMapEntryFixed } from './VerovioTypes';
import { VerovioConverterHelper } from './VerovioConverterHelper';
import { assertIsDefined, fetish } from './helpers';
import { FetchConverter } from './FetchConverter';
import pkg from '../package.json';

/**
 * Implementation of IMIDIConverter that uses statically-rendered Verovio assets:
 * - MIDI file as obtained by `verovio --xml-id-checksum -t midi /path/to/score.musicxml`
 * - Timemap JSON file as obtained by `verovio --xml-id-checksum -t timemap --timemap-options '{ "includeMeasures": true, "includeRests": true }' /path/to/score.musicxml`
 */
export class VerovioStaticConverter extends VerovioConverterHelper implements IMIDIConverter {
  protected _timemap?: MeasureTimemap;
  protected _midi?: ArrayBuffer;

  constructor(
    protected _midiOrUri: ArrayBuffer | string,
    protected _timemapOrUri?: TimeMapEntryFixed[] | string,
  ) {
    super();
  }

  async initialize(musicXml: string) {
    this._midi =
      typeof this._midiOrUri === 'string'
        ? await (await fetish(this._midiOrUri)).arrayBuffer()
        : this._midiOrUri;
    this._timemap =
      typeof this._timemapOrUri === 'undefined'
        ? await FetchConverter.parseTimemap(musicXml)
        : typeof this._timemapOrUri === 'string'
          ? VerovioConverterHelper._parseTimemap(await (await fetish(this._timemapOrUri)).json())
          : VerovioConverterHelper._parseTimemap(this._timemapOrUri);
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
    return `${pkg.name} v${pkg.version}`;
  }
}
