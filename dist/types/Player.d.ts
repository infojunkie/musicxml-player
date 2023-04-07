import { IMidiOutput } from 'midi-player';
import type { IMidiConverter } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
export declare type MeasureIndex = number;
export declare type MillisecsTimestamp = number;
export interface PlayerOptions {
    container: HTMLDivElement | string;
    musicXml: string;
    renderer: ISheetRenderer;
    converter: IMidiConverter;
    output?: IMidiOutput;
}
export declare class Player {
    private output;
    private renderer;
    private converter;
    static load(options: PlayerOptions): Promise<Player>;
    private _midiPlayer;
    private _startTime;
    private _pauseTime;
    private _currentMeasureStartTime;
    private _currentMeasureIndex;
    private _timemapMeasureToTimestamp;
    private constructor();
    moveToMeasure(measure: MeasureIndex, offset: MillisecsTimestamp): void;
    play(): Promise<void>;
    pause(): Promise<void>;
    rewind(): Promise<void>;
    get version(): Record<string, string>;
    private _play;
}
//# sourceMappingURL=Player.d.ts.map