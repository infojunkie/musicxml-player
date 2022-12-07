import { IMidiOutput } from 'midi-player';
export declare type MeasureNumber = number;
export declare type MillisecsTimestamp = number;
export declare class Player {
    private container;
    private musicXml;
    private midiJson;
    private midiOutput;
    private sheetPlayback;
    static load(container: HTMLDivElement | string, musicXml: string, midiBuffer: ArrayBuffer, midiOutput: IMidiOutput): Promise<Player>;
    private mapMeasureToTimestamp;
    private firstMeasureNumber;
    private midiPlayer;
    private startTime;
    private pauseTime;
    private currentMeasureStartTime;
    private currentMeasureNumber;
    private midiFileSlicer;
    private constructor();
    handleCursorEvent(measure: MeasureNumber, millisecs: MillisecsTimestamp): void;
    play(): Promise<void>;
    /**
     * Parse the MIDI file to construct a map linking measures to time offsets.
     */
    private parseMidi;
    private playMidi;
}
//# sourceMappingURL=Player.d.ts.map