import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
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