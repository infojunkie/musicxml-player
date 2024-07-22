import { IMidiOutput, PlayerState } from 'midi-player';
import type { IMidiConverter } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
import { ITimingObject } from 'timing-object';
export type MeasureIndex = number;
export type MillisecsTimestamp = number;
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
     * (Optional) An instance of a TimingObject.
     */
    timingsrc?: ITimingObject;
    /**
     * (Optional) An override to the score title.
     */
    title?: string;
    /**
     * (Optional) A flag to unroll the score before displaying it and playing it.
     */
    unroll?: boolean;
    /**
     * (Optional) A flag to mute the player's MIDI output.
     * It also exists as a dynamic flag during playback.
     */
    mute?: boolean;
}
export declare class Player implements IMidiOutput {
    private _options;
    private _sheet;
    private _parseResult;
    private _musicXml;
    static load(options: PlayerOptions): Promise<Player>;
    private _output;
    private _midiPlayer;
    private _observer;
    private _timingsrc;
    private _timingsrcListener;
    private _midiFile;
    /**
     * A dynamic flag to mute the player's MIDI output.
     */
    mute: boolean;
    private constructor();
    destroy(): void;
    moveTo(measureIndex: MeasureIndex, measureStart: MillisecsTimestamp, measureOffset: MillisecsTimestamp): void;
    play(velocity?: number): Promise<void>;
    pause(): Promise<void>;
    rewind(): Promise<void>;
    get musicXml(): string;
    midi(): Promise<ArrayBuffer>;
    get state(): PlayerState;
    get title(): string;
    get version(): Record<string, string>;
    get timingsrc(): ITimingObject | undefined;
    set timingsrc(timingsrc: ITimingObject | undefined);
    send(data: number[] | Uint8Array, timestamp?: number): void;
    clear(): void;
    private _play;
    private _handleTimingsrcChange;
    private static _unroll;
}
//# sourceMappingURL=Player.d.ts.map