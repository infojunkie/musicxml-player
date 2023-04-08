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
export declare class Player implements IMidiOutput {
    private _output;
    private _renderer;
    private _converter;
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
    send(data: number[] | Uint8Array, timestamp?: number): void;
    clear(): void;
    private _play;
}
//# sourceMappingURL=Player.d.ts.map