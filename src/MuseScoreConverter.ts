import pkg from '../package.json';
import type { IMIDIConverter, MeasureTimemap } from './interfaces/IMIDIConverter';
import { MuseScoreDownloader, MuseScoreBase } from './MuseScoreBase';
import { assertIsDefined } from './helpers';
import type { PlayerOptions } from './Player';
import { IXSLTProcessor } from './interfaces/IXSLTProcessor';

/**
 * Implementation of IMIDIConverter that uses MuseScore to generate the MIDI and timemap structures.
 */
export class MuseScoreConverter
  extends MuseScoreBase
  implements IMIDIConverter {
  constructor(
    downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>,
    xsltProcessor: IXSLTProcessor,
  ) {
    super(downloader, xsltProcessor);
  }

  async initialize(musicXml: string, options: Required<PlayerOptions>): Promise<void> {
    // FIXME should the parent class know about this property?
    this._xsltProcessor = this._xsltProcessor ?? options.xsltProcessor;
    return this._extract(musicXml);
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
    return `${pkg.name}/MuseScoreConverter v${pkg.version}`;
  }
}
