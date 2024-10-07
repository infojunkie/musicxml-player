import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { IOSMDOptions, EngravingRules } from 'opensheetmusicdisplay';
export type EngravingRulesOptions = {
    [Prop in keyof EngravingRules]: EngravingRules[Prop];
};
/**
 * Implementation of ISheetRenderer that uses OpenSheetMusicDisplay @see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
 */
export declare class OpenSheetMusicDisplayRenderer implements ISheetRenderer {
    private _rules?;
    player?: Player;
    private _osmd;
    private _currentMeasureIndex;
    private _currentVoiceEntryIndex;
    private _options;
    constructor(options?: IOSMDOptions, _rules?: EngravingRulesOptions | undefined);
    destroy(): void;
    initialize(container: HTMLElement, musicXml: string): Promise<void>;
    moveTo(index: MeasureIndex, _start: MillisecsTimestamp, offset: MillisecsTimestamp, _duration?: MillisecsTimestamp): void;
    resize(): void;
    get version(): string;
    private _redraw;
    private _timestampToMillisecs;
    private _updateCursor;
}
//# sourceMappingURL=OpenSheetMusicDisplayRenderer.d.ts.map