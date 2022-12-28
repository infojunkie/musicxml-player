import { IMidiOutput } from 'midi-player';
export declare type MeasureNumber = number;
export declare type MillisecsTimestamp = number;
export declare enum Renderer {
    OpenSheetMusicDisplay = 0,
    Verovio = 1
}
export declare class Player {
    private midiJson;
    private midiOutput;
    private sheetPlayback;
    static load(container: HTMLDivElement | string, musicXml: string, midiBuffer: ArrayBuffer, midiOutput: IMidiOutput | null, renderer?: Renderer): Promise<Player>;
    private static createSheetPlayback;
    private mapMeasureToTimestamp;
    private firstMeasureNumber;
    private midiPlayer;
    private startTime;
    private pauseTime;
    private currentMeasureStartTime;
    private currentMeasureNumber;
    private midiFileSlicer;
    private constructor();
    move(measure: MeasureNumber, millisecs: MillisecsTimestamp): void;
    play(): Promise<void>;
    pause(): Promise<void>;
    rewind(): Promise<void>;
    version(): {
        player: string;
        renderer: string;
    };
    /**
     * Parse the MIDI file to construct a map linking measures to time offsets.
     */
    private parseMidi;
    private playMidi;
}
//# sourceMappingURL=Player.d.ts.map