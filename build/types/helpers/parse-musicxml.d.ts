import type { IXSLTProcessor } from '../interfaces/IXSLTProcessor';
export type MusicXmlParseQuery = Record<string, string>;
export type MusicXmlParseResult = {
    musicXml: string;
    queries: Record<string, {
        query: string;
        result: any;
    }>;
};
export declare function parseMusicXml(musicXmlOrBuffer: ArrayBuffer | string, queries?: MusicXmlParseQuery, xsltProcessor?: IXSLTProcessor): Promise<MusicXmlParseResult>;
//# sourceMappingURL=parse-musicxml.d.ts.map