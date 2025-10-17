import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerovioRenderer } from '../../VerovioRenderer';
import {
  SAMPLE_MUSICXML,
  resetGlobals,
  mockVerovioModule,
  installArrayPolyfills,
} from '../helpers/test-utils';

vi.mock('verovio/wasm', () => ({ default: vi.fn(async () => ({})) }));
vi.mock('verovio/esm', () => ({ VerovioToolkit: vi.fn() }));

describe('VerovioRenderer', () => {
  beforeEach(() => {
    resetGlobals();
    installArrayPolyfills();
  });

  it('initializes, renders SVGs and sets version', async () => {
    const { ctor } = mockVerovioModule();
    const { VerovioToolkit } = await import('verovio/esm');
    (VerovioToolkit as any).mockImplementation(ctor);

    const renderer = new VerovioRenderer();
    const container = document.createElement('div');

    // Create a parent element and add container to it
    const parentElement = document.createElement('div');
    // Mock clientHeight using Object.defineProperty
    Object.defineProperty(parentElement, 'clientHeight', {
      value: 800,
      writable: false,
      configurable: true,
    });
    parentElement.appendChild(container);
    document.body.appendChild(parentElement);

    try {
      await renderer.initialize(container, SAMPLE_MUSICXML, {
        container: container,
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

      expect(container.querySelectorAll('.sheet-page').length).toBe(1);
      expect(renderer.version).toContain('verovio');
    } finally {
      // Clean up
      document.body.removeChild(parentElement);
    }
  });

  it('snapshots renderer initialization and DOM structure', async () => {
    const { ctor } = mockVerovioModule();
    const { VerovioToolkit } = await import('verovio/esm');
    (VerovioToolkit as any).mockImplementation(ctor);

    const renderer = new VerovioRenderer();
    const container = document.createElement('div');

    // Create a parent element and add container to it
    const parentElement = document.createElement('div');
    // Mock clientHeight using Object.defineProperty
    Object.defineProperty(parentElement, 'clientHeight', {
      value: 800,
      writable: false,
      configurable: true,
    });
    parentElement.appendChild(container);
    document.body.appendChild(parentElement);

    try {
      await renderer.initialize(container, SAMPLE_MUSICXML, {
        container: container,
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
        version: renderer.version,
        containerHTML: container.innerHTML,
        pageCount: container.querySelectorAll('.sheet-page').length,
        hasVerovioInstance: !!renderer['_vrv'],
      }).toMatchSnapshot();
    } finally {
      // Clean up
      document.body.removeChild(parentElement);
    }
  });
});
