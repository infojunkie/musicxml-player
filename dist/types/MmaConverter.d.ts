import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
/**
 * Implementation of IMidiConverter that queries the musicxml-mma API (@see https://github.com/infojunkie/musicxml-mma)
 * to convert a MusicXML to a MIDI file. It extracts the timemap contained within the MIDI file, expressed as MIDI marker events.
 */
export declare class MmaConverter implements IMidiConverter {
    private _apiUri;
    private _parameters?;
    private _version;
    private _midi;
    private _timemap;
    constructor(_apiUri: string, _parameters?: Record<string, string> | undefined);
    initialize(musicXml: string): Promise<void>;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
    /**
     * Parse an IMidiFile into a timemap.
     */
    static parseTimemap(midi: IMidiFile): MeasureTimemap;
}
//# sourceMappingURL=MmaConverter.d.ts.map