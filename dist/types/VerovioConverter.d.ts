import type { IMidiConverter } from './IMidiConverter';
import { VerovioToolkit } from 'verovio/esm';
export declare class VerovioConverter implements IMidiConverter {
    private vrv;
    constructor();
    version(): Promise<string>;
    convert(musicXml: string): Promise<ArrayBuffer>;
    static _create(): Promise<VerovioToolkit>;
    static _base64ToArrayBuffer(base64: string): ArrayBuffer;
}
//# sourceMappingURL=VerovioConverter.d.ts.map