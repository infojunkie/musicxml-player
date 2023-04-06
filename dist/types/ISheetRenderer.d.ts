import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
export interface ISheetRenderer {
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    seek(measureIndex: MeasureIndex, measureOffset: MillisecsTimestamp): void;
    get version(): string;
}
//# sourceMappingURL=ISheetRenderer.d.ts.map