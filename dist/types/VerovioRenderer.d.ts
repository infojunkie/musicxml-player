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
    private vrv;
    private player;
    private notes;
    private timemap;
    constructor();
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    moveTo(measureIndex: MeasureIndex, measureOffset: MillisecsTimestamp): void;
    get version(): string;
}
//# sourceMappingURL=VerovioRenderer.d.ts.map