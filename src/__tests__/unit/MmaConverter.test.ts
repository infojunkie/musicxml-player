import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MmaConverter } from '../../MmaConverter';

import {
  SAMPLE_MUSICXML,
  SAMPLE_TIMEMAP_JSON,
  createMockXsltProcessor,
  createDummyMidiBuffer,
  withGlobalFetch,
  resetGlobals,
} from '../helpers/test-utils';

describe('MmaConverter', () => {
  beforeEach(() => resetGlobals());

  it('posts to API, receives MIDI, computes timemap via XSLT', async () => {
    const midiBuf = createDummyMidiBuffer();
    // First call: version JSON, second call: convert (MIDI)
    const responses = [
      new Response(
        JSON.stringify({ name: 'musicxml-midi', version: '1.0.0' }),
        { headers: { 'content-type': 'application/json' } },
      ),
      new Response(midiBuf),
    ];
    let call = 0;
    withGlobalFetch(async (_input, init) => {
      // Ensure second call is a POST with FormData
      if (call === 1) {
        expect(init?.method ?? 'GET').toBe('POST');
      }
      return responses[call++];
    });

    const transform = vi.fn(async () => SAMPLE_TIMEMAP_JSON);
    const conv = new MmaConverter('https://api.example.com');
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
      xsltProcessor: { ...createMockXsltProcessor(), transform } as any,
    });

    // Create a snapshot of the converter state
    const snapshot = {
      version: conv.version,
      midiByteLength: conv.midi.byteLength,
      midiData: Array.from(new Uint8Array(conv.midi)),
      timemapLength: conv.timemap.length,
      timemap: conv.timemap,
      transformCalled: transform.mock.calls.length,
      apiVersion: conv['_version'], // Access private property for snapshot
    };

    expect(snapshot).toMatchSnapshot();
  });
});
