import type { IMidiFile } from 'midi-json-parser-worker';
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

  get midiBuffer(): ArrayBuffer {
    assertIsDefined(this._midiBuffer);
    return this._midiBuffer;
  }

  get midiObject(): IMidiFile {
    assertIsDefined(this._midiObject);
    return this._midiObject;
  }

  get timemap(): MeasureTimemap {
    assertIsDefined(this._timemap);
    return this._timemap;
  }

  get version(): string {
    return `MuseScore v${this._mscore?.devinfo.version ?? 'Unknown'}`;
  }
}
