import type { IMIDIConverter, MeasureTimemap } from './IMIDIConverter';
import { MuseScoreDownloader, MuseScoreBase } from './MuseScoreBase';
import { IXSLTProcessor } from './interfaces/IXSLTProcessor';
/**
 * Implementation of IMIDIConverter that uses MuseScore to generate the MIDI and timemap structures.
 */
export declare class MuseScoreConverter extends MuseScoreBase implements IMIDIConverter {
    constructor(downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>, xsltProcessor: IXSLTProcessor);
    initialize(musicXml: string): Promise<void>;
    get midi(): ArrayBuffer;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=MuseScoreConverter.d.ts.map