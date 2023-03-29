import type { ISheetRenderer } from './ISheetRenderer';
import type { IMidiConverter } from './IMidiConverter';
import { IMidiOutput } from 'midi-player';
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
    private midiJson;
    private output;
    private renderer;
    private converter;
    static load(options: PlayerOptions): Promise<Player>;
    private mapMeasureToTimestamp;
    private midiPlayer;
    private startTime;
    private pauseTime;
    private currentMeasureStartTime;
    private currentMeasureIndex;
    private midiFileSlicer;
    private constructor();
    move(measure: MeasureIndex, millisecs: MillisecsTimestamp): void;
    play(): Promise<void>;
    pause(): Promise<void>;
    rewind(): Promise<void>;
    version(): Promise<Record<string, string>>;
    /**
     * Parse the MIDI file to construct a map linking measures to time offsets.
     */
    private parseMidi;
    private playMidi;
}
//# sourceMappingURL=Player.d.ts.map