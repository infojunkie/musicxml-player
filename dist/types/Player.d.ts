import { IMidiOutput, PlayerState } from 'midi-player';
import type { IMidiConverter } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
export declare type MeasureIndex = number;
export declare type MillisecsTimestamp = number;
export interface PlayerOptions {
    container: HTMLDivElement | string;
    musicXml: ArrayBuffer | string;
    renderer: ISheetRenderer;
    converter: IMidiConverter;
    output?: IMidiOutput;
    title?: string;
}
export declare class Player implements IMidiOutput {
    private _output;
    private _renderer;
    private _converter;
    private _musicXml;
    private _title;
    private _container;
    static load(options: PlayerOptions): Promise<Player>;
    private _midiPlayer;
    private _startTime;
    private _pauseTime;
    private _currentMeasureStartTime;
    private _currentMeasureIndex;
    private _timemapMeasureToTimestamp;
    private _observer;
    private constructor();
    destroy(): void;
    moveTo(measure: MeasureIndex, offset: MillisecsTimestamp): void;
    play(): Promise<void>;
    pause(): Promise<void>;
    rewind(): Promise<void>;
    get musicXml(): string;
    get state(): PlayerState;
    get title(): string | null;
    get version(): Record<string, string>;
    send(data: number[] | Uint8Array, timestamp?: number): void;
    clear(): void;
    private _play;
}
//# sourceMappingURL=Player.d.ts.map