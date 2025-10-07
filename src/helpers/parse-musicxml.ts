import { unzip } from 'unzipit';
import type { IXSLTProcessor } from '../interfaces/IXSLTProcessor';
import { SaxonJSAdapter } from '../adapters/SaxonJSAdapter';

export type MusicXmlParseQuery = Record<string, string>;
export type MusicXmlParseResult = {
  musicXml: string;
  queries: Record<string, { query: string; result: any }>;
};

export async function parseMusicXml(
  musicXmlOrBuffer: ArrayBuffer | string,
  queries?: MusicXmlParseQuery,
  xsltProcessor?: IXSLTProcessor,
): Promise<MusicXmlParseResult> {
  if (musicXmlOrBuffer instanceof ArrayBuffer) {
    // Decode the buffer and try it as an uncompressed document.
    const musicXml = new TextDecoder().decode(musicXmlOrBuffer);
    try {
      return await _parseUncompressed(musicXml, queries, xsltProcessor);
    } catch {
      // Do nothing: just keep going.
    }

    // Try the buffer as a compressed document.
    return await _parseCompressed(musicXmlOrBuffer, queries, xsltProcessor);
  } else {
    // A string is assumed to be an uncompressed document.
    return await _parseUncompressed(musicXmlOrBuffer, queries, xsltProcessor);
  }
}

async function _parseCompressed(
  mxml: ArrayBuffer,
  queries?: MusicXmlParseQuery,
  xsltProcessor?: IXSLTProcessor,
): Promise<MusicXmlParseResult> {
  const saxon = xsltProcessor || new SaxonJSAdapter();
  const { entries } = await unzip(mxml);

  // Extract rootfile from META-INF/container.xml.
  const decoder = new TextDecoder();
  const containerBuf = await entries['META-INF/container.xml'].arrayBuffer();
  const doc = await saxon.getResource({
    type: 'xml',
    encoding: 'utf8',
    text: decoder.decode(containerBuf),
  });
  const rootFile = saxon.XPath.evaluate('//rootfile[1]/@full-path', doc);
  if (!rootFile) {
    throw new Error(
      '[parseMusicXml] Invalid compressed MusicXML file does not contain rootfile/@full-path.',
    );
  }

  // Parse root document as MusicXML.
  const rootBuf = await entries[rootFile.value].arrayBuffer();
  return _parseUncompressed(decoder.decode(rootBuf), queries, xsltProcessor);
}

async function _parseUncompressed(
  musicXml: string,
  queries?: MusicXmlParseQuery,
  xsltProcessor?: IXSLTProcessor,
): Promise<MusicXmlParseResult> {
  const saxon = xsltProcessor || new SaxonJSAdapter();
  const doc = await saxon.getResource({
    type: 'xml',
    encoding: 'utf8',
    text: musicXml,
  });
  const valid = saxon.XPath.evaluate(
    'boolean(//score-partwise | //score-timewise)',
    doc,
  );
  if (!valid) {
    throw new Error(
      '[parseMusicXml] Invalid MusicXML file contains neither score-partwise nor score-timewise.',
    );
  }
  const version = saxon.XPath.evaluate(
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
        const result = saxon.XPath.evaluate(queries[k], doc);
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
