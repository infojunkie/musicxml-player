import { ISheetRenderer } from "./ISheetRenderer";
import { MeasureTimemapEntry } from './IMidiConverter';
import { TimeMapEntryFixed, VerovioBase } from "./VerovioBase";
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { Cursor } from './Cursor';
/**
 * Implementation of ISheetRenderer that uses statically-rendered Verovio assets:
 * - SVG files as obtained by `verovio --xml-id-checksum -t svg /path/to/score.musicxml`
 * - Timemap JSON file as obtained by `verovio --xml-id-checksum -t timemap --timemap-options '{ "includeMeasures": true, "includeRests": true }' /path/to/score.musicxml`
 */
export declare class VerovioStaticRenderer extends VerovioBase implements ISheetRenderer {
    protected _svgOrUris: Array<ArrayBuffer | string>;
    protected _timemapOrUri: TimeMapEntryFixed[] | string;
    player?: Player;
    protected _cursor: Cursor;
    protected _timemap?: (TimeMapEntryFixed & {
        rectNotes: DOMRect[];
        notesOn: string[];
    })[];
    protected _measures: (MeasureTimemapEntry & {
        entry: number;
        rectMeasure: DOMRect;
        rectSystem: DOMRect;
    })[];
    protected _currentNotes: {
        domid: string;
        fill: string | null;
        stroke: string | null;
    }[];
    protected _currentEntry?: number;
    constructor(_svgOrUris: Array<ArrayBuffer | string>, _timemapOrUri: TimeMapEntryFixed[] | string);
    destroy(): void;
    initialize(container: HTMLElement, _musicXml: string): Promise<void>;
    moveTo(index: MeasureIndex, start: MillisecsTimestamp, offset: MillisecsTimestamp, duration?: MillisecsTimestamp): void;
    resize(): void;
    get version(): string;
}
//# sourceMappingURL=VerovioStaticRenderer.d.ts.map