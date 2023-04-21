import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
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
    private _timemap;
    private _container;
    private _scale;
    constructor();
    destroy(): void;
    initialize(player: Player, container: HTMLElement, musicXml: string): Promise<void>;
    moveTo(measureIndex: MeasureIndex, measureOffset: MillisecsTimestamp): void;
    resize(): void;
    get version(): string;
    private _redraw;
}
//# sourceMappingURL=VerovioRenderer.d.ts.map