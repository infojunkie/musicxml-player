import pkg from '../package.json';
import type { IMIDIConverter, MeasureTimemap } from './interfaces/IMIDIConverter';
import { IXSLTProcessor } from './interfaces/IXSLTProcessor';
import { MuseScoreDownloader, MuseScoreBase } from './MuseScoreBase';
import { assertIsDefined } from './helpers';

/**
 * Implementation of IMIDIConverter that uses MuseScore to generate the MIDI and timemap structures.
 */
export class MuseScoreConverter
  extends MuseScoreBase
  implements IMIDIConverter
{
  constructor(
    downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>,
    xsltProcessor: IXSLTProcessor,
  ) {
    super(downloader, xsltProcessor);
  }

  async initialize(musicXml: string): Promise<void> {
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
