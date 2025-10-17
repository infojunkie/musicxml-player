import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MuseScoreRenderer } from '../../MuseScoreRenderer';
import {
  SAMPLE_MUSICXML,
  createMockXsltProcessor,
  resetGlobals,
  installArrayPolyfills,
} from '../helpers/test-utils';

function createMuseScoreMedia() {
  const svg = btoa('<svg width="800" height="600"></svg>');
  const sposXML = btoa(`
    <elements>
      <element x="0" y="0" sx="100" sy="50" page="0" position="0" measure="0"/>
      <element x="100" y="0" sx="100" sy="50" page="0" position="1000" measure="1"/>
    </elements>
  `);
  const mposXML = btoa('<xml/>');
  // FIXEME this is ugly
  const midi = btoa('\u0000\u0001');
  return {
    svgs: [svg],
    sposXML,
    mposXML,
    midi,
    metadata: { duration: 1 } as any,
    devinfo: { version: '4.0.0' },
  } as any;
}

describe('MuseScoreRenderer', () => {
  beforeEach(() => {
    resetGlobals();
    installArrayPolyfills();
  });

  it('initializes and renders MuseScore pages from provided media', async () => {
    const media = createMuseScoreMedia();
    const renderer = new MuseScoreRenderer(() => media);
    const container = document.createElement('div');

    // Mock the moveTo method to avoid DOM issues
    const moveToSpy = vi.spyOn(renderer, 'moveTo').mockImplementation(() => {});

    await renderer.initialize(container, SAMPLE_MUSICXML, {
      container,
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
      horizontal: true,
      followCursor: true,
      xsltProcessor: createMockXsltProcessor() as any,
    });
    // one page injected
    expect(container.querySelectorAll('#page-0').length).toBe(1);
    expect(renderer.version).toContain('MuseScoreRenderer');

    // Verify moveTo was called
    expect(moveToSpy).toHaveBeenCalledWith(0, 0, 0);
  });

  it('snapshots renderer initialization and DOM structure', async () => {
    const media = createMuseScoreMedia();
    const renderer = new MuseScoreRenderer(() => media);
    const container = document.createElement('div');

    // Mock the moveTo method to avoid DOM issues
    vi.spyOn(renderer, 'moveTo').mockImplementation(() => {});

    await renderer.initialize(container, SAMPLE_MUSICXML, {
      container,
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
      horizontal: true,
      followCursor: true,
      xsltProcessor: createMockXsltProcessor() as any,
    });

    expect({
      version: renderer.version,
      containerHTML: container.innerHTML,
      pageCount: container.querySelectorAll('[id^="page-"]').length,
    }).toMatchSnapshot();
  });
});
