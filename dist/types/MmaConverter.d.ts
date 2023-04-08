import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
/**
 * Implementation of IMidiConverter that queries the musicxml-mma API (@see https://github.com/infojunkie/musicxml-mma)
 * to convert a MusicXML to a MIDI file. It extracts the timemap contained within the MIDI file, expressed as MIDI marker events.
 */
export declare class MmaConverter implements IMidiConverter {
    private apiUri;
    private _version;
    private _midi;
    private _timemap;
    constructor(apiUri: string);
    initialize(musicXml: string): Promise<void>;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
    private static _parse;
}
//# sourceMappingURL=MmaConverter.d.ts.map