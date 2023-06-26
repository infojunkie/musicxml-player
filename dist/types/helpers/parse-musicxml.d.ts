export declare type MusicXmlParseQuery = Record<string, string>;
export declare type MusicXmlParseResult = {
    musicXml: string;
    queries: Record<string, {
        query: string;
        result: any;
    }>;
};
export declare function parseMusicXml(musicXmlOrBuffer: ArrayBuffer | string, queries?: MusicXmlParseQuery): Promise<MusicXmlParseResult>;
//# sourceMappingURL=parse-musicxml.d.ts.map