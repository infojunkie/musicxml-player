import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { VerovioOptions } from 'verovio';
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
/**
 * Implementation of ISheetRenderer that uses Verovio @see https://github.com/rism-digital/verovio
 */
export declare class VerovioRenderer implements ISheetRenderer {
    private _vrv;
    private _player;
    private _notes;
    private _container;
    private _vrvOptions;
    private _cursorOptions;
    private _timemap;
    private _measures;
    private _cursor;
    private _position;
    private _scroll;
    private _measure;
    constructor(vrvOptions?: VerovioOptions, cursorOptions?: CursorOptions);
    destroy(): void;
    initialize(player: Player, container: HTMLElement, musicXml: string): Promise<void>;
    moveTo(index: MeasureIndex, start: MillisecsTimestamp, offset: MillisecsTimestamp, duration?: MillisecsTimestamp): void;
    resize(): void;
    get version(): string;
    private _isHorizontalLayout;
    private _moveCursor;
    private _drawSheet;
}
//# sourceMappingURL=VerovioRenderer.d.ts.map