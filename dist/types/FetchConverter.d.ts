import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
export declare class FetchConverter implements IMidiConverter {
    private _midiOrUri;
    private _timemapOrUri;
    private _timemap;
    private _midi;
    constructor(_midiOrUri: IMidiFile | string, _timemapOrUri: MeasureTimemap | string);
    initialize(): Promise<void>;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=FetchConverter.d.ts.map