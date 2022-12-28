import type { ISheetPlayback } from './ISheetPlayback';
import type { MeasureNumber, MillisecsTimestamp, Player } from './Player';
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
export declare class VerovioPlayback implements ISheetPlayback {
    private vrv;
    private player;
    private ids;
    private measures;
    constructor();
    version(): string;
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    seek(measureIndex: MeasureNumber, measureMillisecs: MillisecsTimestamp): void;
}
//# sourceMappingURL=VerovioPlayback.d.ts.map