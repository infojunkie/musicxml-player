import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
/**
 * Implementation of IMidiConverter that queries the musicxml-midi API (@see https://github.com/infojunkie/musicxml-midi)
 * to convert a MusicXML to a MIDI file. It extracts the timemap contained within the MIDI file, expressed as MIDI marker events.
 */
export declare class MmaConverter implements IMidiConverter {
    protected _parameters?: Record<string, string> | undefined;
    protected _version?: {
        name: string;
        version: string;
    };
    protected _midi?: IMidiFile;
    protected _timemap?: MeasureTimemap;
    protected _uri: string;
    constructor(uri: string, _parameters?: Record<string, string> | undefined);
    initialize(musicXml: string): Promise<void>;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
    /**
     * Parse an IMidiFile into a timemap.
     */
    protected static _parseTimemap(midi: IMidiFile): MeasureTimemap;
}
//# sourceMappingURL=MmaConverter.d.ts.map