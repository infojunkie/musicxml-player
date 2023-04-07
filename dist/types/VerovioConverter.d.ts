import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
export declare class VerovioConverter implements IMidiConverter {
    private _vrv;
    private _timemap;
    private _midi;
    constructor();
    initialize(musicXml: string): Promise<void>;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
    private static _base64ToArrayBuffer;
}
//# sourceMappingURL=VerovioConverter.d.ts.map