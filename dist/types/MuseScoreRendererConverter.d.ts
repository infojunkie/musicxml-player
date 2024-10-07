import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp } from './Player';
export type MuseScoreDownloader = (musicXml: string) => {
    pngs?: string[];
    svgs: string[];
    sposXML: string;
    mposXML: string;
    pdf?: string;
    midi: string;
    mxml?: string;
    metadata: {
        composer: string;
        duration: number;
        fileVersion: number;
        hasHarmonies: boolean;
        hasLyrics: boolean;
        keysig: number;
        lyrics?: string;
        measures: number;
        mscoreVersion: string;
        pageFormat: {
            height: number;
            twosided: boolean;
            width: number;
        };
        pages: number;
        parts: {
            harmonyCount: number;
            hasDrumStaff: boolean;
            hasPitchedStaff: boolean;
            hasTabStaff: boolean;
            instrumentId: string;
            isVisible: boolean;
            lyricCount: number;
            name: string;
            program: number;
        }[];
        poet: string;
        previousSource: string;
        subtitle: string;
        tempo: number;
        tempoText: string;
        textFramesData: {
            composers: string[];
            poets: string[];
            subtitles: string[];
            titles: string[];
        };
        timesig: string;
        title: string;
    };
    devinfo: {
        version: string;
    };
};
/**
 * Implementation of ISheetRenderer and IMidiConverter that uses MuseScore to generate the SVG, MIDI, and timemap files.
 *
 * Generate the score media with MuseScore as follows: `./mscore /path/to/score.musicxml --score-media > /path/to/score.json`
 */
export declare class MuseScoreRendererConverter implements ISheetRenderer, IMidiConverter {
    private _downloader;
    private _media?;
    private _midi?;
    private _timemap?;
    constructor(_downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>);
    destroy(): void;
    initialize(container: HTMLElement, musicXml: string): Promise<void>;
    moveTo(_index: MeasureIndex, _start: MillisecsTimestamp, _offset: MillisecsTimestamp, _duration?: MillisecsTimestamp): void;
    resize(): void;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=MuseScoreRendererConverter.d.ts.map