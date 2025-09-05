/// <reference types="webmidi" />
import { BasicMIDI } from 'spessasynth_core';
import { WorkletSynthesizer as Synthetizer, Sequencer } from 'spessasynth_lib';
import { MusicXmlParseResult } from './helpers';
import type { IMidiConverter } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
export type MeasureIndex = number;
export type MillisecsTimestamp = number;
export declare enum PlayerState {
    Stopped = 0,
    Playing = 1,
    Paused = 2
}
/**
 * A structure holding the Player creation options.
 */
export interface PlayerOptions {
    /**
     * The HTML element containing the sheet.
     */
    container: HTMLDivElement | string;
    /**
     * The input MusicXML score, as text string or ArrayBuffer (for compressed MXL).
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
     * If omitted, a local Web Audio synthesizer will be used.
     */
    output?: WebMidi.MIDIOutput;
    /**
     * (Optional) Soundfond URL.
     * If omitted, the default soundfont will be used.
     */
    soundfontUri?: string;
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
export declare class Player {
    protected _options: PlayerOptions;
    protected _sheet: HTMLElement;
    protected _parseResult: MusicXmlParseResult;
    protected _musicXml: string;
    protected _synthesizer: Synthetizer;
    /**
     * Create a new instance of the player.
     *
     * @param options Player options.
     * @returns A new instance of the player, ready to play.
     * @throws Error exception with various error messages.
     */
    static create(options: PlayerOptions): Promise<Player>;
    protected _sequencer: Sequencer;
    protected _midi: BasicMIDI;
    protected _observer: ResizeObserver;
    protected _duration: number;
    protected _state: PlayerState;
    protected constructor(_options: PlayerOptions, _sheet: HTMLElement, _parseResult: MusicXmlParseResult, _musicXml: string, _synthesizer: Synthetizer);
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
     */
    play(): void;
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
     * The MIDI buffer.
     */
    get midi(): ArrayBuffer;
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
     * Unroll the score by expanding all repeats and jumps into a linear score.
     */
    protected static _unrollMusicXml(musicXml: string): Promise<string>;
    /**
     * Adjust the incoming MIDI file by inserting a no-op CC message at the end of the last measure
     * based on the durations reported by the timemap. This forces the MIDI player to end on the
     * measure boundary.
     *
     * @see https://github.com/spessasus/SpessaSynth/discussions/176
     */
    protected static _adjustMidiDuration(converter: IMidiConverter): BasicMIDI;
}
//# sourceMappingURL=Player.d.ts.map