import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
export interface ISheetRenderer {
    version(): string;
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    seek(measureIndex: MeasureIndex, measureMillisecs: MillisecsTimestamp): void;
}
//# sourceMappingURL=ISheetRenderer.d.ts.map