import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import { MuseScoreDownloader, MuseScoreBase } from './MuseScoreBase';
/**
 * Implementation of IMidiConverter that uses MuseScore to generate the MIDI and timemap structures.
 */
export declare class MuseScoreConverter extends MuseScoreBase implements IMidiConverter {
    constructor(downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>);
    initialize(musicXml: string): Promise<void>;
    get midi(): ArrayBuffer;
    get timemap(): MeasureTimemap;
}
//# sourceMappingURL=MuseScoreConverter.d.ts.map