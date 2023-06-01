import { IMidiOutput, PlayerState } from 'midi-player';
import type { IMidiConverter } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
export declare type MeasureIndex = number;
export declare type MillisecsTimestamp = number;
export interface PlayerOptions {
    /**
     * The HTML element containing the sheet.
     */
    container: HTMLDivElement | string;
    /**
     * The input MusicXML score, as text string or compressed ArrayBuffer.
     */
    musicXml: ArrayBuffer | string;
    /**
     * An instance of the sheet renderer used to render the score.
     */
    renderer: ISheetRenderer;
    /**
     * An instance of the MIDI converter used to convert the score to MIDI.
     */
    converter: IMidiConverter;
    /**
     * (Optional) An instance of the MIDI output to send the note events.
     * If ommitted, a local Web Audio synthesizer will be used.
     */
    output?: IMidiOutput;
    /**
     * (Optional) An override to the score title.
     */
    title?: string;
    /**
     * (Optional) A flag to unroll the score before displaying it and playing it.
     */
    unroll?: boolean;
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
    private static _unroll;
}
//# sourceMappingURL=Player.d.ts.map