import type { IMidiConverter } from './IMidiConverter';
export declare class FetchConverter implements IMidiConverter {
    private midiUri;
    constructor(midiUri: string);
    version(): string;
    convert(): Promise<ArrayBuffer>;
}
//# sourceMappingURL=FetchConverter.d.ts.map