import type { ISheetPlayback } from './ISheetPlayback';
import type { MeasureNumber, MillisecsTimestamp, Player } from './Player';
import { Fraction, SourceMeasure } from 'opensheetmusicdisplay';
export declare class OpenSheetMusicDisplayPlayback implements ISheetPlayback {
    private player;
    private osmd;
    private currentMeasureIndex;
    private currentVoiceEntryIndex;
    constructor();
    version(): string;
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    timestampToMillisecs(measure: SourceMeasure, timestamp: Fraction): number;
    updateCursor(measureIndex: number, voiceEntryIndex: number): void;
    seek(measureIndex: MeasureNumber, measureMillisecs: MillisecsTimestamp): void;
}
//# sourceMappingURL=OpenSheetMusicDisplayPlayback.d.ts.map