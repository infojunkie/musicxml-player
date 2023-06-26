import { unzip } from 'unzipit';
import SaxonJS from '../saxon-js/SaxonJS2.rt';

export type MusicXmlParseQuery = Record<string, string>;
export type MusicXmlParseResult = {
  musicXml: string;
  queries: Record<string, { query: string; result: any }>;
};

export async function parseMusicXml(
  musicXmlOrBuffer: ArrayBuffer | string,
  queries?: MusicXmlParseQuery,
): Promise<MusicXmlParseResult> {
  if (musicXmlOrBuffer instanceof ArrayBuffer) {
    // Decode the buffer and try it as an uncompressed document.
    const musicXml = new TextDecoder().decode(musicXmlOrBuffer);
    try {
      return await _parseUncompressedMusicXml(musicXml, queries);
    } catch {
      // Do nothing: just keep going.
    }

    // Try the buffer as a compressed document.
    return await _parseCompressedMusicXml(musicXmlOrBuffer, queries);
  } else {
    // A string is assumed to be an uncompressed document.
    return await _parseUncompressedMusicXml(musicXmlOrBuffer, queries);
  }
}

async function _parseCompressedMusicXml(
  mxml: ArrayBuffer,
  queries: MusicXmlParseQuery | undefined,
): Promise<MusicXmlParseResult> {
  const { entries } = await unzip(mxml);

  // Extract rootfile from META-INF/container.xml.
  const decoder = new TextDecoder();
  const containerBuf = await entries['META-INF/container.xml'].arrayBuffer();
  const doc = await SaxonJS.getResource({
    type: 'xml',
    encoding: 'utf8',
    text: decoder.decode(containerBuf),
  });
  const rootFile = SaxonJS.XPath.evaluate('//rootfile[1]/@full-path', doc);
  if (!rootFile)
    throw new Error(
      'Invalid compressed MusicXML file does not contain rootfile/@full-path.',
    );

  // Parse root document as MusicXML.
  const rootBuf = await entries[rootFile.value].arrayBuffer();
  return _parseUncompressedMusicXml(decoder.decode(rootBuf), queries);
}

async function _parseUncompressedMusicXml(
  musicXml: string,
  queries: MusicXmlParseQuery | undefined,
): Promise<MusicXmlParseResult> {
  const doc = await SaxonJS.getResource({
    type: 'xml',
    encoding: 'utf8',
    text: musicXml,
  });
  const version = SaxonJS.XPath.evaluate('//score-partwise/@version', doc) ?? {
    value: '(unknown)',
  };
  console.debug(`[parseMusicXml] MusicXML version ${version.value}`);
  const parseResult: MusicXmlParseResult = {
    musicXml,
    queries: {},
  };
  if (queries)
    for (const k in queries) {
      try {
        const result = SaxonJS.XPath.evaluate(queries[k], doc);
        if (result) {
          parseResult.queries[k] = {
            query: queries[k],
            result: result.nodeValue ?? result.value ?? null,
          };
        } else throw 'not found';
      } catch {
        parseResult.queries[k] = {
          query: queries[k],
          result: null,
        };
      }
    }
  return parseResult;
}
