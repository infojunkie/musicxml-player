import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { MeasureTimemap } from './IMidiConverter';
import { VerovioOptionsFixed, CursorOptions, VerovioToolkitFixed } from './VerovioBase';
/**
 * Implementation of ISheetRenderer that uses Verovio to convert a MusicXML file to SVGs and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertosvg
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 */
export declare class VerovioRenderer implements ISheetRenderer {
    player?: Player;
    protected _vrv?: VerovioToolkitFixed;
    protected _container?: HTMLElement;
    protected _notes: string[];
    protected _vrvOptions: VerovioOptionsFixed;
    protected _cursorOptions: CursorOptions;
    protected _timemap: MeasureTimemap;
    protected _measures: {
        rects: DOMRect[];
        elements: SVGGElement[];
    };
    protected _cursor: HTMLDivElement;
    protected _position: {
        x: number;
        y: number;
        height: number;
    };
    protected _scroll: {
        offset: number;
        left: number;
        top: number;
    };
    protected _measure: {
        index: MeasureIndex;
        start: MillisecsTimestamp;
        offset: MillisecsTimestamp;
        duration: MillisecsTimestamp | undefined;
    };
    constructor(vrvOptions?: VerovioOptionsFixed, cursorOptions?: CursorOptions);
    destroy(): void;
    initialize(container: HTMLElement, musicXml: string): Promise<void>;
    moveTo(index: MeasureIndex, start: MillisecsTimestamp, offset: MillisecsTimestamp, duration?: MillisecsTimestamp): void;
    resize(): void;
    get version(): string;
    protected _isHorizontalLayout(): boolean;
    protected _move(): void;
    protected _redraw(): void;
}
//# sourceMappingURL=VerovioRenderer.d.ts.map