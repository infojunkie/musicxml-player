import { describe, it, expect, beforeEach } from 'vitest';
import { VerovioStaticConverter } from '../../VerovioStaticConverter';
import {
  SAMPLE_MUSICXML,
  createDummyMidiBuffer,
  withGlobalFetch,
  resetGlobals,
  installArrayPolyfills,
} from '../helpers/test-utils';

describe('VerovioStaticConverter', () => {
  beforeEach(() => {
    resetGlobals();
    installArrayPolyfills();
  });

  it('initializes with URIs (fetches midi and timemap JSON)', async () => {
    const midiBuf = createDummyMidiBuffer();
    const responses = [
      new Response(midiBuf),
      new Response(
        JSON.stringify([{ measureOn: 'm1', tstamp: 0 }, { tstamp: 1000 }]),
        { headers: { 'content-type': 'application/json' } },
      ),
    ];
    let call = 0;
    withGlobalFetch(async () => responses[call++]);

    const conv = new VerovioStaticConverter(
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
      xsltProcessor: {} as any,
    });

    expect(conv.midi.byteLength).toBe(midiBuf.byteLength);
    expect(conv.timemap.length).toBeGreaterThan(0);
    expect(conv.version).toContain('VerovioStaticConverter');
  });

  it('initializes with provided buffers and timemap entries directly', async () => {
    const midiBuf = createDummyMidiBuffer();
    const conv = new VerovioStaticConverter(midiBuf, [
      { measureOn: 'm1', tstamp: 0 },
      { tstamp: 1000 },
    ] as any);
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
      xsltProcessor: {} as any,
    });
    expect(conv.timemap.length).toBe(1);
  });

  it('snapshots static converter initialization with URIs', async () => {
    const midiBuf = createDummyMidiBuffer();
    const responses = [
      new Response(midiBuf),
      new Response(
        JSON.stringify([{ measureOn: 'm1', tstamp: 0 }, { tstamp: 1000 }]),
        { headers: { 'content-type': 'application/json' } },
      ),
    ];
    let call = 0;
    withGlobalFetch(async () => responses[call++]);

    const conv = new VerovioStaticConverter(
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
      xsltProcessor: {} as any,
    });

    expect({
      version: conv.version,
      midiByteLength: conv.midi.byteLength,
      timemapLength: conv.timemap.length,
      timemapStructure: conv.timemap.map((entry) => ({
        measure: entry.measure,
        timestamp: entry.timestamp,
        duration: entry.duration,
      })),
    }).toMatchSnapshot();
  });
});
