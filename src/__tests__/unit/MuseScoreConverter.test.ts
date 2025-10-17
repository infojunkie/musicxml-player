import { describe, it, expect, beforeEach } from 'vitest';
import { MuseScoreConverter } from '../../MuseScoreConverter';
import {
  SAMPLE_MUSICXML,
  createMockXsltProcessor,
  createDummyMidiBuffer,
  resetGlobals,
  installArrayPolyfills,
} from '../helpers/test-utils';

function createMuseScoreMedia() {
  // Minimal structure matching MuseScoreBase expectations
  const midi = btoa(
    String.fromCharCode(...new Uint8Array(createDummyMidiBuffer())),
  );
  const mposXML = btoa('<xml/>');
  return {
    svgs: [btoa('<svg></svg>')],
    sposXML: btoa('<xml/>'),
    mposXML,
    midi,
    metadata: { duration: 1 } as any,
    devinfo: { version: '4.0.0' },
  } as any;
}

describe('MuseScoreConverter', () => {
  beforeEach(() => {
    resetGlobals();
    installArrayPolyfills();
  });

  it('initializes using provided media struct via function and builds timemap/midi', async () => {
    const media = createMuseScoreMedia();
    const downloader = () => media;
    const conv = new MuseScoreConverter(downloader);

    await conv.initialize(SAMPLE_MUSICXML, {
      container: document.createElement('div'),
      musicXml: SAMPLE_MUSICXML,
      renderer: {} as any,
      converter: {} as any,
      output: null,
      soundfontUri: '',
      unrollXslUri: '',
      timemapXslUri: '',
      unroll: false,
      mute: false,
      repeat: 1,
      velocity: 1,
      horizontal: false,
      followCursor: true,
      xsltProcessor: createMockXsltProcessor() as any,
    });
    expect(conv.midi.byteLength).toBeGreaterThan(0);
    expect(conv.timemap.length).toBeGreaterThan(0);
    expect(conv.version).toContain('MuseScoreConverter');
  });

  it('can use array.last() polyfill', () => {
    const testArray = [1, 2, 3, 4, 5];
    expect(testArray.last()).toBe(5);

    const emptyArray: number[] = [];
    expect(() => emptyArray.last()).toThrow(
      'Cannot get last element of empty array',
    );

    const stringArray = ['a', 'b', 'c'];
    expect(stringArray.last()).toBe('c');
  });

  it('can use array.clear() and array.contains() polyfills', () => {
    const testArray = [1, 2, 3, 4, 5];

    expect(testArray.contains(3)).toBe(true);
    expect(testArray.contains(6)).toBe(false);

    testArray.clear();
    expect(testArray.length).toBe(0);
    expect(testArray).toEqual([]);
  });

  it('snapshots converter initialization and properties', async () => {
    const media = createMuseScoreMedia();
    const downloader = () => media;
    const conv = new MuseScoreConverter(downloader);
    await conv.initialize(SAMPLE_MUSICXML, {
      container: document.createElement('div'),
      musicXml: SAMPLE_MUSICXML,
      renderer: {} as any,
      converter: {} as any,
      output: null,
      soundfontUri: '',
      unrollXslUri: '',
      timemapXslUri: '',
      unroll: false,
      mute: false,
      repeat: 1,
      velocity: 1,
      horizontal: false,
      followCursor: true,
      xsltProcessor: createMockXsltProcessor() as any,
    });

    expect(conv).toMatchSnapshot({
      midi: expect.any(ArrayBuffer),
      timemap: expect.any(Array),
      version: expect.any(String),
    });
  });
});
