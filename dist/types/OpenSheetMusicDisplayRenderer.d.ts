import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { Fraction, IOSMDOptions, OpenSheetMusicDisplay, SourceMeasure, EngravingRules } from 'opensheetmusicdisplay';
export type EngravingRulesOptions = {
    [Prop in keyof EngravingRules]: EngravingRules[Prop];
};
/**
 * Implementation of ISheetRenderer that uses OpenSheetMusicDisplay @see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
 */
export declare class OpenSheetMusicDisplayRenderer implements ISheetRenderer {
    protected _rules?: EngravingRulesOptions | undefined;
    player?: Player;
    protected _osmd: OpenSheetMusicDisplay | undefined;
    protected _currentMeasureIndex: MeasureIndex;
    protected _currentVoiceEntryIndex: number;
    protected _options: IOSMDOptions;
    constructor(options?: IOSMDOptions, _rules?: EngravingRulesOptions | undefined);
    destroy(): void;
    initialize(container: HTMLElement, musicXml: string): Promise<void>;
    moveTo(index: MeasureIndex, _start: MillisecsTimestamp, offset: MillisecsTimestamp, _duration?: MillisecsTimestamp): void;
    resize(): void;
    get version(): string;
    protected _redraw(): void;
    protected _timestampToMillisecs(measure: SourceMeasure, timestamp: Fraction): number;
    protected _updateCursor(index: number, voiceEntryIndex: number): void;
}
//# sourceMappingURL=OpenSheetMusicDisplayRenderer.d.ts.map