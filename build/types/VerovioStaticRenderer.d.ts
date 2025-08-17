import { ISheetRenderer } from "./ISheetRenderer";
import { TimeMapEntryFixed, VerovioBase } from "./VerovioBase";
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
/**
 * Implementation of ISheetRenderer that uses statically-rendered Verovio assets:
 * - SVG files as obtained by `verovio --xml-id-checksum -t svg /path/to/score.musicxml`
 * - Timemap JSON file as obtained by `verovio --xml-id-checksum -t timemap --timemap-options '{ "includeMeasures": true, "includeRests": true }' /path/to/score.musicxml`
 */
export declare class VerovioStaticRenderer extends VerovioBase implements ISheetRenderer {
    protected _svgOrUris: Array<ArrayBuffer | string>;
    protected _timemapOrUri: TimeMapEntryFixed[] | string;
    player?: Player;
    protected _cursor: HTMLDivElement;
    protected _timemap?: TimeMapEntryFixed[];
    constructor(_svgOrUris: Array<ArrayBuffer | string>, _timemapOrUri: TimeMapEntryFixed[] | string);
    destroy(): void;
    initialize(container: HTMLElement, _musicXml: string): Promise<void>;
    moveTo(_index: MeasureIndex, _start: MillisecsTimestamp, _offset: MillisecsTimestamp, _duration?: MillisecsTimestamp): void;
    resize(): void;
    get version(): string;
}
//# sourceMappingURL=VerovioStaticRenderer.d.ts.map