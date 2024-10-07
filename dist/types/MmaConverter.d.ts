import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
/**
 * Implementation of IMidiConverter that queries the musicxml-midi API (@see https://github.com/infojunkie/musicxml-midi)
 * to convert a MusicXML to a MIDI file. It extracts the timemap contained within the MIDI file, expressed as MIDI marker events.
 */
export declare class MmaConverter implements IMidiConverter {
    private _apiUri;
    private _parameters?;
    private _version?;
    private _midi?;
    private _timemap?;
    constructor(_apiUri: string, _parameters?: Record<string, string> | undefined);
    initialize(_container: HTMLElement, musicXml: string): Promise<void>;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
    /**
     * Parse an IMidiFile into a timemap.
     */
    private static _parseTimemap;
}
//# sourceMappingURL=MmaConverter.d.ts.map