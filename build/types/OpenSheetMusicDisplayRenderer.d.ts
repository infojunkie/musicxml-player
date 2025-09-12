import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player, PlayerOptions } from './Player';
import { Fraction, IOSMDOptions, OpenSheetMusicDisplay, SourceMeasure, EngravingRules } from 'opensheetmusicdisplay';
export type EngravingRulesOptions = {
    [Prop in keyof EngravingRules]: EngravingRules[Prop];
};
/**
 * Implementation of ISheetRenderer that uses OpenSheetMusicDisplay @see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
 */
export declare class OpenSheetMusicDisplayRenderer implements ISheetRenderer {
    protected _engravingOptions?: EngravingRulesOptions | undefined;
    player?: Player;
    protected _osmd: OpenSheetMusicDisplay | undefined;
    protected _currentMeasureIndex: MeasureIndex;
    protected _currentVoiceEntryIndex: number;
    protected _osmdOptions: IOSMDOptions;
    constructor(osmdOptions?: IOSMDOptions, _engravingOptions?: EngravingRulesOptions | undefined);
    destroy(): void;
    initialize(container: HTMLElement, musicXml: string, options: Required<PlayerOptions>): Promise<void>;
    moveTo(index: MeasureIndex, _start: MillisecsTimestamp, offset: MillisecsTimestamp, _duration?: MillisecsTimestamp): void;
    onResize(): void;
    onEvent(): void;
    get version(): string;
    protected _redraw(): void;
    protected _timestampToMillisecs(measure: SourceMeasure, timestamp: Fraction): number;
    protected _updateCursor(index: number, voiceEntryIndex: number): void;
}
//# sourceMappingURL=OpenSheetMusicDisplayRenderer.d.ts.map