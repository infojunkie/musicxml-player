import type { IXSLTProcessor } from '../interfaces/IXSLTProcessor';
/**
 * Unroll the MusicXML score by expanding all repeats and jumps into a linear score.
 */
export declare function unrollMusicXml(musicXml: string, unrollXslUri: string, xsltProcessor: IXSLTProcessor): Promise<string>;
//# sourceMappingURL=unroll-musicxml.d.ts.map