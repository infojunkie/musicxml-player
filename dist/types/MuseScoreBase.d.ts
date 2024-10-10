import type { IMidiFile } from 'midi-json-parser-worker';
import type { MeasureTimemap } from './IMidiConverter';
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
 * Base class for MuseScore scores that parses the score metadata and creates a timemap.
 *
 * Generate the score media with MuseScore as follows: `./mscore /path/to/score.musicxml --score-media > /path/to/score.json`
 */
export declare class MuseScoreBase {
    protected _downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>;
    protected _mscore?: ReturnType<MuseScoreDownloader>;
    protected _midi?: IMidiFile;
    protected _timemap?: MeasureTimemap;
    protected _mpos?: object;
    constructor(_downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>);
    extract(musicXml: string): Promise<void>;
}
//# sourceMappingURL=MuseScoreBase.d.ts.map