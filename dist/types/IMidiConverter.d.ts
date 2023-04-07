import type { IMidiFile } from 'midi-json-parser-worker';
import type { MeasureIndex, MillisecsTimestamp } from "./Player";
export declare type MeasureTimemapEntry = {
    measure: MeasureIndex;
    timestamp: MillisecsTimestamp;
};
export declare type MeasureTimemap = Array<MeasureTimemapEntry>;
export interface IMidiConverter {
    /**
     * Initialize the MIDI converter.
     * This method can be expected to be called only once and should prepare the following:
     * - The MIDI file (parsed into JSON via `midi-json-parser`)
     * - The measure timemap
     * - The version number
     * @param musicXml the MusicXML score to convert.
     */
    initialize(musicXml: string): Promise<void>;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=IMidiConverter.d.ts.map