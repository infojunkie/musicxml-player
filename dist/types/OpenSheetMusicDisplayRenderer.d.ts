import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { OSMDOptions, EngravingRules } from 'opensheetmusicdisplay';
export declare type EngravingRulesOptions = {
    [Prop in keyof EngravingRules]: EngravingRules[Prop];
};
/**
 * Implementation of ISheetRenderer that uses OpenSheetMusicDisplay @see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
 */
export declare class OpenSheetMusicDisplayRenderer implements ISheetRenderer {
    private _rules?;
    private _player;
    private _osmd;
    private _currentMeasureIndex;
    private _currentVoiceEntryIndex;
    private _options;
    constructor(options?: OSMDOptions, _rules?: EngravingRulesOptions | undefined);
    destroy(): void;
    initialize(player: Player, container: HTMLElement, musicXml: string): Promise<void>;
    moveTo(measureIndex: MeasureIndex, measureOffset: MillisecsTimestamp): void;
    resize(): void;
    get version(): string;
    private _redraw;
    private _timestampToMillisecs;
    private _updateCursor;
}
//# sourceMappingURL=OpenSheetMusicDisplayRenderer.d.ts.map