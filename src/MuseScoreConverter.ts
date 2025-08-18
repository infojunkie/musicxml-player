import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import { MuseScoreDownloader, MuseScoreBase } from './MuseScoreBase';
import { assertIsDefined } from './helpers';

/**
 * Implementation of IMidiConverter that uses MuseScore to generate the MIDI and timemap structures.
 */
export class MuseScoreConverter
  extends MuseScoreBase
  implements IMidiConverter
{
  constructor(
    downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>,
  ) {
    super(downloader);
  }

  async initialize(musicXml: string): Promise<void> {
    return this.extract(musicXml);
  }

  get midi(): ArrayBuffer {
    assertIsDefined(this._midi);
    return this._midi;
  }

  get timemap(): MeasureTimemap {
    assertIsDefined(this._timemap);
    return this._timemap;
  }
}
