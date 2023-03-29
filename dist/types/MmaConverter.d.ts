import type { IMidiConverter } from './IMidiConverter';
export declare class MmaConverter implements IMidiConverter {
    private apiUri;
    constructor(apiUri: string);
    version(): Promise<string>;
    convert(musicXml: string): Promise<ArrayBuffer>;
}
//# sourceMappingURL=MmaConverter.d.ts.map