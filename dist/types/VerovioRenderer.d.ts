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
export declare class VerovioRenderer implements ISheetRenderer {
    private vrv;
    private player;
    private notes;
    private timemap;
    constructor();
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    seek(measureIndex: MeasureIndex, measureOffset: MillisecsTimestamp): void;
    get version(): string;
}
//# sourceMappingURL=VerovioRenderer.d.ts.map