export type MusicXMLParseQuery = Record<string, string>;
export type MusicXMLParseResult = {
    musicXml: string;
    queries: Record<string, {
        query: string;
        result: any;
    }>;
};
export declare function parseMusicXML(musicXmlOrBuffer: ArrayBuffer | string, queries?: MusicXMLParseQuery): Promise<MusicXMLParseResult>;
//# sourceMappingURL=parse-musicxml.d.ts.map