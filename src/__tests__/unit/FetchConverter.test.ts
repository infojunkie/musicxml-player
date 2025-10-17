import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FetchConverter } from '../../FetchConverter';
import {
  SAMPLE_MUSICXML,
  SAMPLE_TIMEMAP_JSON,
  createMockXsltProcessor,
  createDummyMidiBuffer,
  withGlobalFetch,
  resetGlobals,
} from '../helpers/test-utils';

describe('FetchConverter', () => {
  beforeEach(() => resetGlobals());

  it('initializes with URIs (fetches midi and timemap JSON)', async () => {
    const midiBuf = createDummyMidiBuffer();
    const responses = [
      new Response(midiBuf),
      new Response(SAMPLE_TIMEMAP_JSON, {
        headers: { 'content-type': 'application/json' },
      }),
    ];
    let call = 0;
    withGlobalFetch(async () => responses[call++]);

    const conv = new FetchConverter(
      'https://example.com/midi.mid',
      'https://example.com/timemap.json',
    );
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

    // Create a snapshot of the converter state
    const snapshot = {
      version: conv.version,
      midiByteLength: conv.midi.byteLength,
      midiData: Array.from(new Uint8Array(conv.midi)),
      timemapLength: conv.timemap.length,
      timemap: conv.timemap,
    };

    expect(snapshot).toMatchSnapshot();
  });

  it('initializes with provided buffers (no fetch) and computes timemap via XSLT when timemap missing', async () => {
    const mockXsltProcessor = createMockXsltProcessor();
    const midiBuf = createDummyMidiBuffer();
    const transform = vi.fn(async () => SAMPLE_TIMEMAP_JSON);
    const xslt = { ...mockXsltProcessor, transform } as any;
    const conv = new FetchConverter(midiBuf);
    await conv.initialize(SAMPLE_MUSICXML, {
      container: document.createElement('div'),
      musicXml: SAMPLE_MUSICXML,
      renderer: {} as any,
      converter: {} as any,
      output: null,
      soundfontUri: '',
      unrollXslUri: '',
      timemapXslUri: 'timemap.sef.json',
      unroll: false,
      mute: false,
      repeat: 1,
      velocity: 1,
      horizontal: false,
      followCursor: true,
      xsltProcessor: xslt,
    });

    // Create a snapshot of the converter state
    const snapshot = {
      version: conv.version,
      midiByteLength: conv.midi.byteLength,
      midiData: Array.from(new Uint8Array(conv.midi)),
      timemapLength: conv.timemap.length,
      timemap: conv.timemap,
      transformCalled: transform.mock.calls.length,
    };

    expect(snapshot).toMatchSnapshot();
  });
});
