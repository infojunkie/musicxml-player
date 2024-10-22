import { IMidiOutput, IMidiPlayer, PlayerState } from 'midi-player';
import { IMidiFile } from 'midi-json-parser-worker';
import { MusicXmlParseResult } from './helpers';
import type { IMidiConverter } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
import { ITimingObject } from 'timing-object';
export type MeasureIndex = number;
export type MillisecsTimestamp = number;
/**
 * A structure holding the Player creation options.
 */
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
     * (Optional) A flag to unroll the score before displaying it and playing it.
     */
    unroll?: boolean;
    /**
     * (Optional) A flag to mute the player's MIDI output.
     * Can also be changed dynamically via Player.mute attribute.
     */
    mute?: boolean;
    /**
     * (Optional) Repeat count. A value of -1 means loop forever.
     * Can also be changed dynamically via Player.repeat attribute.
     */
    repeat?: number;
    /**
     * (Optional) Playback speed. A value of 1 means normal speed.
     * Can also be changed dynamically via Player.velocity attribute.
     */
    velocity?: number;
}
export declare class Player implements IMidiOutput {
    protected _options: PlayerOptions;
    protected _sheet: HTMLElement;
    protected _parseResult: MusicXmlParseResult;
    protected _musicXml: string;
    /**
     * Create a new instance of the player.
     *
     * @param options Player options.
     * @returns A new instance of the player, ready to play.
     * @throws Error exception with various error messages.
     */
    static create(options: PlayerOptions): Promise<Player>;
    protected _output: IMidiOutput;
    protected _midiPlayer: IMidiPlayer;
    protected _observer: ResizeObserver;
    protected _midiFile: IMidiFile;
    protected _duration: number;
    protected _mute: boolean;
    protected _repeat: number;
    protected _velocity: number;
    protected _timingObject: ITimingObject;
    protected _timingObjectListener: EventListener;
    protected constructor(_options: PlayerOptions, _sheet: HTMLElement, _parseResult: MusicXmlParseResult, _musicXml: string);
    /**
     * Destroy the instance by freeing all resources and disconnecting observers.
     */
    destroy(): void;
    /**
     * Advance the playback and visual cursor to a given location.
     *
     * @param measureIndex Measure index (0-based)
     * @param measureStart Timestamp of measure onset in real time (ms)
     * @param measureOffset Timestamp offset within measure (ms)
     */
    moveTo(measureIndex: MeasureIndex, measureStart: MillisecsTimestamp, measureOffset: MillisecsTimestamp): void;
    /**
     * Start playback.
     *
     * @param velocity Playback rate
     * @returns A promise that resolves when the player is paused or stopped.
     */
    play(): Promise<void>;
    /**
     * Pause playback.
     */
    pause(): void;
    /**
     * Stop playback and rewind to start.
     */
    rewind(): void;
    /**
     * The version numbers of the player components.
     */
    get version(): Record<string, string>;
    /**
     * The MusicXML score.
     */
    get musicXml(): string;
    /**
     * The MIDI file.
     * @returns A promise that resolves to the ArrayBuffer containing the MIDI file binary representation.
     */
    midi(): Promise<ArrayBuffer>;
    /**
     * The player state.
     */
    get state(): PlayerState;
    /**
     * The score title (can be blank).
     */
    get title(): string;
    /**
     * The duration of the score/MIDI file (ms).
     * Precomputed in the constructor.
     */
    get duration(): number;
    /**
     * Current position of the player (ms).
     */
    get position(): number;
    /**
     * The TimingObject attached to the player.
     */
    get timingObject(): ITimingObject;
    /**
     * Repeat count. A value of -1 means loop forever.
     */
    set repeat(value: number);
    /**
     * A flag to mute the player's MIDI output.
     */
    set mute(value: boolean);
    /**
     * Playback speed. A value of 1 means normal speed.
     */
    set velocity(value: number);
    /**
     * Implementation of IMidiOutput.send().
     *
     * @param data The MIDI event(s) to send
     * @param timestamp Timestamp of events onset in ms.
     *
     * We implement IMidiOutput here to capture any interesting events
     * such as MARKER events with Groove information.
     */
    send(data: number[] | Uint8Array, timestamp?: number): void;
    /**
     * Implementation of IMidiOutput.clear().
     */
    clear(): void;
    protected _play(): Promise<void>;
    protected _handleTimingObjectChange(_event: Event): void;
    protected static _unroll(musicXml: string): Promise<string>;
}
//# sourceMappingURL=Player.d.ts.map