import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import { TimeMapEntryFixed, VerovioBase } from './VerovioBase';
import { assertIsDefined, fetish } from './helpers';
import { FetchConverter } from './FetchConverter';
import pkg from '../package.json';

/**
 * Implementation of IMidiConverter that uses statically-rendered Verovio assets:
 * - MIDI file as obtained by `verovio --xml-id-checksum -t midi /path/to/score.musicxml`
 * - Timemap JSON file as obtained by `verovio --xml-id-checksum -t timemap --timemap-options '{ "includeMeasures": true, "includeRests": true }' /path/to/score.musicxml`
 */
export class VerovioStaticConverter extends VerovioBase implements IMidiConverter {
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
          ? VerovioBase._parseTimemap(await (await fetish(this._timemapOrUri)).json())
          : VerovioBase._parseTimemap(this._timemapOrUri);
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
