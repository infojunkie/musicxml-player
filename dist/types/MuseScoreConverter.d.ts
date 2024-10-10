import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import { MuseScoreDownloader, MuseScoreBase } from './MuseScoreBase';
/**
 * Implementation of IMidiConverter that uses MuseScore to generate the MIDI and timemap structures.
 */
export declare class MuseScoreConverter extends MuseScoreBase implements IMidiConverter {
    constructor(downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>);
    initialize(musicXml: string): Promise<void>;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=MuseScoreConverter.d.ts.map