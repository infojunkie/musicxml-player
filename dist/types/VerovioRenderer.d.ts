import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { VerovioOptions } from 'verovio';
export interface TimeMapEntryFixed {
    tstamp: number;
    qstamp: number;
    on?: string[];
    off?: string[];
    restsOn?: string[];
    restsOff?: string[];
    tempo?: number;
    measureOn: string;
}
/**
 * Implementation of ISheetRenderer that uses Verovio @see https://github.com/rism-digital/verovio
 */
export declare class VerovioRenderer implements ISheetRenderer {
    private _vrv;
    private _player;
    private _notes;
    private _container;
    private _options;
    private _timemap;
    private _measures;
    private _cursor;
    private _position;
    private _scroll;
    private _measure;
    constructor(options?: VerovioOptions);
    destroy(): void;
    initialize(player: Player, container: HTMLElement, musicXml: string): Promise<void>;
    moveTo(measureIndex: MeasureIndex, measureStart: MillisecsTimestamp, measureOffset: MillisecsTimestamp, measureDuration?: MillisecsTimestamp): void;
    resize(): void;
    get version(): string;
    private _isHorizontalLayout;
    private _moveCursor;
    private _drawSheet;
}
//# sourceMappingURL=VerovioRenderer.d.ts.map