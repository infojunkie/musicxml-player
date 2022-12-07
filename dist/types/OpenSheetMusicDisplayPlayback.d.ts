import type { ISheetPlayback } from './ISheetPlayback';
import type { Player } from './Player';
import { Fraction, SourceMeasure } from 'opensheetmusicdisplay';
export declare class OpenSheetMusicDisplayPlayback implements ISheetPlayback {
    private player;
    private osmd;
    private currentMeasureIndex;
    private currentVoiceEntryIndex;
    constructor();
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    timestampToMillisecs(measure: SourceMeasure, timestamp: Fraction): number;
    updateCursor(measureIndex: number, voiceEntryIndex: number): void;
    moveToMeasureTime(measureIndex: number, measureMillisecs: number): void;
}
//# sourceMappingURL=OpenSheetMusicDisplayPlayback.d.ts.map