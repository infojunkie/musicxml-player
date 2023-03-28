export interface IMidiConverter {
    version(): string;
    convert(musicXml: string): Promise<ArrayBuffer>;
}
//# sourceMappingURL=IMidiConverter.d.ts.map