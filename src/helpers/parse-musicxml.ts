import { unzip } from 'unzipit';
import type { IXSLTProcessor } from '../interfaces/IXSLTProcessor';

export type MusicXmlParseQuery = Record<string, string>;
export type MusicXmlParseResult = {
  musicXml: string;
  queries: Record<string, { query: string; result: any }>;
};

export async function parseMusicXml(
  musicXmlOrBuffer: ArrayBuffer | string,
  xsltProcessor: IXSLTProcessor,
  queries?: MusicXmlParseQuery,
): Promise<MusicXmlParseResult> {
  if (musicXmlOrBuffer instanceof ArrayBuffer) {
    // Decode the buffer and try it as an uncompressed document.
    const musicXml = new TextDecoder().decode(musicXmlOrBuffer);
    try {
      return await _parseUncompressed(musicXml, xsltProcessor, queries);
    } catch {
      // Do nothing: just keep going.
    }

    // Try the buffer as a compressed document.
    return await _parseCompressed(xsltProcessor, musicXmlOrBuffer, queries);
  } else {
    // A string is assumed to be an uncompressed document.
    return await _parseUncompressed(musicXmlOrBuffer, xsltProcessor, queries);
  }
}

async function _parseCompressed(
  xsltProcessor: IXSLTProcessor,
  mxml: ArrayBuffer,
  queries?: MusicXmlParseQuery,
): Promise<MusicXmlParseResult> {
  const { entries } = await unzip(mxml);

  // Extract rootfile from META-INF/container.xml.
  const decoder = new TextDecoder();
  const containerBuf = await entries['META-INF/container.xml'].arrayBuffer();
  const doc = await xsltProcessor.parse({
    text: decoder.decode(containerBuf),
  });
  const rootFile = xsltProcessor.query('//rootfile[1]/@full-path', doc);
  if (!rootFile) {
    throw new Error(
      '[parseMusicXml] Invalid compressed MusicXML file does not contain rootfile/@full-path.',
    );
  }

  // Parse root document as MusicXML.
  const rootBuf = await entries[rootFile.value].arrayBuffer();
  return _parseUncompressed(decoder.decode(rootBuf), xsltProcessor, queries);
}

async function _parseUncompressed(
  musicXml: string,
  xsltProcessor: IXSLTProcessor,
  queries?: MusicXmlParseQuery,
): Promise<MusicXmlParseResult> {
  const doc = await xsltProcessor.parse({
    text: musicXml,
  });
  const valid = xsltProcessor.query(
    'boolean(//score-partwise | //score-timewise)',
    doc,
  );
  if (!valid) {
    throw new Error(
      '[parseMusicXml] Invalid MusicXML file contains neither score-partwise nor score-timewise.',
    );
  }
  const version = xsltProcessor.query(
    '//score-partwise/@version | //score-timewise/@version',
    doc,
  ) ?? {
    value: '(unknown)',
  };
  console.info(`[parseMusicXml] MusicXML ${version.value}`);
  const parseResult: MusicXmlParseResult = {
    musicXml,
    queries: {},
  };
  if (queries)
    for (const k in queries) {
      try {
        const result = xsltProcessor.query(queries[k], doc);
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
