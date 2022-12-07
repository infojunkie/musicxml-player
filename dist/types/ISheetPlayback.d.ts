import type { MeasureNumber, MillisecsTimestamp, Player } from './Player';
export interface ISheetPlayback {
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    moveToMeasureTime(measureIndex: MeasureNumber, measureMillisecs: MillisecsTimestamp): void;
}
//# sourceMappingURL=ISheetPlayback.d.ts.map