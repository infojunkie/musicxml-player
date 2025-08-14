import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { VerovioToolkit } from 'verovio/esm';
import { VerovioOptions } from 'verovio';
import { MeasureTimemap } from './IMidiConverter';
export interface TimemapEntryFixed {
    tstamp: number;
    qstamp: number;
    on?: string[];
    off?: string[];
    restsOn?: string[];
    restsOff?: string[];
    tempo?: number;
    measureOn: string;
}
export interface CursorOptions {
    scrollOffset: number;
}
export interface ElementsAtTimeFixed {
    notes: string[];
    rests: string[];
    chords: string[];
    page: number;
    measure: string;
}
export interface VerovioToolkitFixed extends VerovioToolkit {
    destroy(): void;
}
export interface VerovioOptionsFixed extends VerovioOptions {
    tuning?: string;
}
/**
 * Implementation of ISheetRenderer that uses Verovio.
 * @see https://github.com/rism-digital/verovio
 */
export declare class VerovioRenderer implements ISheetRenderer {
    player?: Player;
    protected _vrv?: VerovioToolkitFixed;
    protected _container?: HTMLElement;
    protected _notes: string[];
    protected _vrvOptions: VerovioOptions;
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
    constructor(vrvOptions?: VerovioOptions, cursorOptions?: CursorOptions);
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