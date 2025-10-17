import type { IMIDIConverter, MeasureTimemap } from './interfaces/IMIDIConverter';
import { MuseScoreDownloader, MuseScoreBase } from './MuseScoreBase';
import type { PlayerOptions } from './Player';
/**
 * Implementation of IMIDIConverter that uses MuseScore to generate the MIDI and timemap structures.
 */
export declare class MuseScoreConverter extends MuseScoreBase implements IMIDIConverter {
    constructor(downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>);
    initialize(musicXml: string, options: Required<PlayerOptions>): Promise<void>;
    get midi(): ArrayBuffer;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=MuseScoreConverter.d.ts.map