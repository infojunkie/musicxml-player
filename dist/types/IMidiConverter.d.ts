export interface IMidiConverter {
    version(): Promise<string>;
    convert(musicXml: string): Promise<ArrayBuffer>;
}
//# sourceMappingURL=IMidiConverter.d.ts.map