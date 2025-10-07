import type { IXSLTProcessor } from '../interfaces/IXSLTProcessor';
import { MeasureTimemap } from '../IMIDIConverter';

/**
 * Parse a MusicXML score into a timemap.
 */
export async function parseMusicXmlTimemap(
  musicXml: string,
  timemapXslUri: string,
  xsltProcessor: IXSLTProcessor,
): Promise<MeasureTimemap> {
  try {
    const timemap = await xsltProcessor.transform(
      {
        stylesheetLocation: timemapXslUri,
        sourceText: musicXml,
        destination: 'serialized',
        stylesheetParams: {
          useSef: true,
        },
      },
      'sync',
    );
    return JSON.parse(timemap.principalResult);
  } catch (error) {
    console.error(`[parseMusicXmlTimemap] ${error}`);
  }
  return [];
}
