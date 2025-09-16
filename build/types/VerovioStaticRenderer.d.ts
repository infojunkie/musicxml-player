import { ISheetRenderer } from './ISheetRenderer';
import { TimeMapEntryFixed } from './VerovioTypes';
import { VerovioRendererBase } from './VerovioRendererBase';
import { type MeasureIndex, type MillisecsTimestamp, type PlayerOptions } from './Player';
/**
 * Implementation of ISheetRenderer that uses statically-rendered Verovio assets:
 * - SVG files as obtained by `verovio --xml-id-checksum -t svg /path/to/score.musicxml`
 * - Timemap JSON file as obtained by `verovio --xml-id-checksum -t timemap --timemap-options '{ "includeMeasures": true, "includeRests": true }' /path/to/score.musicxml`
 */
export declare class VerovioStaticRenderer extends VerovioRendererBase implements ISheetRenderer {
    protected _svgOrUris: Array<ArrayBuffer | string>;
    protected _eventsOrUri: TimeMapEntryFixed[] | string;
    constructor(_svgOrUris: Array<ArrayBuffer | string>, _eventsOrUri: TimeMapEntryFixed[] | string);
    destroy(): void;
    initialize(container: HTMLElement, _musicXml: string, options: PlayerOptions): Promise<void>;
    moveTo(index: MeasureIndex, start: MillisecsTimestamp, offset: MillisecsTimestamp, duration?: MillisecsTimestamp): void;
    onResize(): void;
    onEvent(): void;
    get version(): string;
}
//# sourceMappingURL=VerovioStaticRenderer.d.ts.map