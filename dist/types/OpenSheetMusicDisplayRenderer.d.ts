import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
/**
 * Implementation of ISheetRenderer that uses OpenSheetMusicDisplay @see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
 */
export declare class OpenSheetMusicDisplayRenderer implements ISheetRenderer {
    private player;
    private osmd;
    private currentMeasureIndex;
    private currentVoiceEntryIndex;
    constructor();
    initialize(player: Player, container: HTMLDivElement | string, musicXml: string): Promise<void>;
    moveTo(measureIndex: MeasureIndex, measureOffset: MillisecsTimestamp): void;
    get version(): string;
    private _timestampToMillisecs;
    private _updateCursor;
}
//# sourceMappingURL=OpenSheetMusicDisplayRenderer.d.ts.map