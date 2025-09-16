import SaxonJS from '../saxon-js/SaxonJS3.rt';
import { MeasureTimemap } from '../IMIDIConverter';

/**
 * Parse a MusicXML score into a timemap.
 */
export async function parseMusicXmlTimemap(
  musicXml: string,
  timemapXslUri: string,
): Promise<MeasureTimemap> {
  try {
    const timemap = await SaxonJS.transform(
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
