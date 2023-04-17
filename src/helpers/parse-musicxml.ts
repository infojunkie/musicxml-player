import { unzip } from 'unzipit';

type MusicXmlAndTitle = {
  musicXml: string;
  title: string | null;
};

export async function parseMusicXml(
  musicXmlOrBuffer: ArrayBuffer | string,
): Promise<MusicXmlAndTitle | null> {
  if (musicXmlOrBuffer instanceof ArrayBuffer) {
    // Decode the buffer and try it as an uncompressed document.
    const musicXml = new TextDecoder().decode(musicXmlOrBuffer);
    const result = _parseUncompressedMusicXml(musicXml);
    if (result) return result;

    // Try the buffer as a compressed document.
    return await _parseCompressedMusicXml(musicXmlOrBuffer);
  } else {
    // A string is assumed to be an uncompressed document.
    return _parseUncompressedMusicXml(musicXmlOrBuffer);
  }
}

async function _parseCompressedMusicXml(
  mxml: ArrayBuffer,
): Promise<MusicXmlAndTitle | null> {
  try {
    const { entries } = await unzip(mxml);

    // Extract rootfile from META-INF/container.xml.
    const decoder = new TextDecoder();
    const containerBuf = await entries['META-INF/container.xml'].arrayBuffer();
    const doc = new DOMParser().parseFromString(
      decoder.decode(containerBuf),
      'text/xml',
    );
    if (doc.querySelector('parsererror')) return null;
    const rootFile = doc
      .getElementsByTagName('rootfile')[0]
      .getAttribute('full-path');
    if (!rootFile) return null;

    // Parse root document as MusicXML.
    const rootBuf = await entries[rootFile].arrayBuffer();
    return _parseUncompressedMusicXml(decoder.decode(rootBuf));
  } catch (error) {
    console.warn(`[parseMusicXml] ${error}`);
  }
  return null;
}

function _parseUncompressedMusicXml(musicXml: string): MusicXmlAndTitle | null {
  try {
    const doc = new DOMParser().parseFromString(musicXml, 'text/xml');
    if (doc.querySelector('parsererror')) return null;

    // TODO Validate the MusicXML if possible/needed.

    return {
      musicXml,
      title: _extractMusicXmlTitle(doc),
    };
  } catch (error) {
    console.warn(`[parseMusicXml] ${error}`);
  }
  return null;
}

function _extractMusicXmlTitle(doc: Document): string | null {
  try {
    return doc.getElementsByTagName('work-title')[0].textContent;
  } catch (error) {
    console.warn(`[parseMusicXml] ${error}`);
  }
  return null;
}
