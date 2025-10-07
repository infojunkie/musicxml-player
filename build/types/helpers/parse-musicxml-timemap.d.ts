import type { IXSLTProcessor } from '../interfaces/IXSLTProcessor';
import { MeasureTimemap } from '../IMIDIConverter';
/**
 * Parse a MusicXML score into a timemap.
 */
export declare function parseMusicXmlTimemap(musicXml: string, timemapXslUri: string, xsltProcessor: IXSLTProcessor): Promise<MeasureTimemap>;
//# sourceMappingURL=parse-musicxml-timemap.d.ts.map