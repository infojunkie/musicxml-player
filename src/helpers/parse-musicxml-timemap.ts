import type { IXSLTProcessor } from '../interfaces/IXSLTProcessor';
import { MeasureTimemap } from '../interfaces/IMIDIConverter';

/**
 * Parse a MusicXML score into a timemap.
 */
export async function parseMusicXmlTimemap(
  musicXml: string,
  timemapXslUri: string,
  xsltProcessor: IXSLTProcessor,
): Promise<MeasureTimemap> {
  try {
    const timemap = await xsltProcessor.transform(timemapXslUri, musicXml, {
      useSef: true,
    });
    return JSON.parse(timemap);
  } catch (error) {
    console.error(`[parseMusicXmlTimemap] ${error}`);
  }
  return [];
}
