import type { ISheetPlayback } from './ISheetPlayback';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
export declare class VerovioPlayback implements ISheetPlayback {
    private vrv;
    private player;
    private notes;
    private timestamps;
    constructor();
    version(): string;
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    seek(measureIndex: MeasureIndex, measureMillisecs: MillisecsTimestamp): void;
}
//# sourceMappingURL=VerovioPlayback.d.ts.map