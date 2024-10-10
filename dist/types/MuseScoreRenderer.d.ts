import type { ISheetRenderer } from './ISheetRenderer';
import { MuseScoreDownloader, MuseScoreBase } from './MuseScoreBase';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
type MuseScorePosition = {
    x: number;
    y: number;
    sx: number;
    sy: number;
    page: number;
};
/**
 * Implementation of ISheetRenderer that uses MuseScore to generate the SVG score.
 *
 * Generate the score media with MuseScore as follows: `./mscore /path/to/score.musicxml --score-media > /path/to/score.json`
 */
export declare class MuseScoreRenderer extends MuseScoreBase implements ISheetRenderer {
    player?: Player;
    protected _cursor: HTMLDivElement;
    protected _measures?: MuseScorePosition[];
    protected _segments?: (MuseScorePosition & {
        timestamp: MillisecsTimestamp;
        duration: MillisecsTimestamp;
        measure: MeasureIndex;
    })[];
    constructor(downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>);
    destroy(): void;
    initialize(container: HTMLElement, musicXml: string): Promise<void>;
    moveTo(index: MeasureIndex, start: MillisecsTimestamp, offset: MillisecsTimestamp, _duration?: MillisecsTimestamp): void;
    resize(): void;
    get version(): string;
}
export {};
//# sourceMappingURL=MuseScoreRenderer.d.ts.map