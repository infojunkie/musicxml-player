import type { ISheetRenderer } from './ISheetRenderer';
import type { IMidiConverter } from './IMidiConverter';
import { IMidiOutput } from 'midi-player';
export declare type MeasureIndex = number;
export declare type MillisecsTimestamp = number;
export declare type MeasureTimemap = Array<MillisecsTimestamp[]>;
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
    private midiPlayer;
    private startTime;
    private pauseTime;
    private currentMeasureStartTime;
    private currentMeasureIndex;
    private midiFileSlicer;
    private constructor();
    moveToMeasure(measure: MeasureIndex, millisecs: MillisecsTimestamp): void;
    play(): Promise<void>;
    pause(): Promise<void>;
    rewind(): Promise<void>;
    get version(): Record<string, string>;
    private _play;
}
//# sourceMappingURL=Player.d.ts.map