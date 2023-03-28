import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { Fraction, SourceMeasure } from 'opensheetmusicdisplay';
export declare class OpenSheetMusicDisplayRenderer implements ISheetRenderer {
    private player;
    private osmd;
    private currentMeasureIndex;
    private currentVoiceEntryIndex;
    constructor();
    version(): string;
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    timestampToMillisecs(measure: SourceMeasure, timestamp: Fraction): number;
    updateCursor(measureIndex: number, voiceEntryIndex: number): void;
    seek(measureIndex: MeasureIndex, measureMillisecs: MillisecsTimestamp): void;
}
//# sourceMappingURL=OpenSheetMusicDisplayRenderer.d.ts.map