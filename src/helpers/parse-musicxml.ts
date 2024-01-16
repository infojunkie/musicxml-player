import { unzip } from 'unzipit';
import SaxonJS from '../saxon-js/SaxonJS2.rt';

export type MusicXMLParseQuery = Record<string, string>;
export type MusicXMLParseResult = {
  musicXml: string;
  queries: Record<string, { query: string; result: any }>;
};

export async function parseMusicXML(
  musicXmlOrBuffer: ArrayBuffer | string,
  queries?: MusicXMLParseQuery,
): Promise<MusicXMLParseResult> {
  if (musicXmlOrBuffer instanceof ArrayBuffer) {
    // Decode the buffer and try it as an uncompressed document.
    const musicXml = new TextDecoder().decode(musicXmlOrBuffer);
    try {
      return await _parseUncompressedMusicXML(musicXml, queries);
    } catch {
      // Do nothing: just keep going.
    }

    // Try the buffer as a compressed document.
    return await _parseCompressedMusicXML(musicXmlOrBuffer, queries);
  } else {
    // A string is assumed to be an uncompressed document.
    return await _parseUncompressedMusicXML(musicXmlOrBuffer, queries);
  }
}

async function _parseCompressedMusicXML(
  mxml: ArrayBuffer,
  queries: MusicXMLParseQuery | undefined,
): Promise<MusicXMLParseResult> {
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
  if (!rootFile) {
    throw new Error(
      '[parseMusicXML] Invalid compressed MusicXML file does not contain rootfile/@full-path.',
    );
  }

  // Parse root document as MusicXML.
  const rootBuf = await entries[rootFile.value].arrayBuffer();
  return _parseUncompressedMusicXML(decoder.decode(rootBuf), queries);
}

async function _parseUncompressedMusicXML(
  musicXml: string,
  queries: MusicXMLParseQuery | undefined,
): Promise<MusicXMLParseResult> {
  const doc = await SaxonJS.getResource({
    type: 'xml',
    encoding: 'utf8',
    text: musicXml,
  });
  const valid = SaxonJS.XPath.evaluate('boolean(//score-partwise | //score-timewise)', doc);
  if (!valid) {
    throw new Error(
      '[parseMusicXML] Invalid MusicXML file contains neither score-partwise nor score-timewise.',
    )
  }
  const version = SaxonJS.XPath.evaluate('//score-partwise/@version | //score-timewise/@version', doc) ?? {
    value: '(unknown)',
  };
  console.debug(`[parseMusicXML] MusicXML version ${version.value}`);
  const parseResult: MusicXMLParseResult = {
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
