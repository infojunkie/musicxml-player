import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerovioStaticRenderer } from '../../VerovioStaticRenderer';
import { resetGlobals, installArrayPolyfills } from '../helpers/test-utils';

describe('VerovioStaticRenderer', () => {
  beforeEach(() => {
    resetGlobals();
    installArrayPolyfills();
  });

  it('initializes with static assets and renders', async () => {
    // Create a more realistic SVG structure that matches what Verovio would generate
    const svgContent = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <g class="system" id="system1">
          <g id="m1" class="measure">
            <rect x="10" y="10" width="80" height="20" fill="none" stroke="black"/>
          </g>
        </g>
      </svg>
    `;
    const svg = new TextEncoder().encode(svgContent).buffer;
    const events = [{ measureOn: 'm1', tstamp: 0 }, { tstamp: 1000 }];
    const renderer = new VerovioStaticRenderer([svg], events as any);
    const container = document.createElement('div');

    // Add the container to the document body so getElementById works
    document.body.appendChild(container);

    // Mock scrollIntoView method
    const mockScrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;

    try {
      await renderer.initialize(container, '<xml/>', {
        container: container,
        musicXml: '<xml/>',
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
      expect(renderer.version).toContain('VerovioStaticRenderer');
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  });

  it('snapshots static renderer initialization and DOM structure', async () => {
    // Create a more realistic SVG structure that matches what Verovio would generate
    const svgContent = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <g class="system" id="system1">
          <g id="m1" class="measure">
            <rect x="10" y="10" width="80" height="20" fill="none" stroke="black"/>
          </g>
        </g>
      </svg>
    `;
    const svg = new TextEncoder().encode(svgContent).buffer;
    const events = [{ measureOn: 'm1', tstamp: 0 }, { tstamp: 1000 }];
    const renderer = new VerovioStaticRenderer([svg], events as any);
    const container = document.createElement('div');

    // Add the container to the document body so getElementById works
    document.body.appendChild(container);

    // Mock scrollIntoView method
    const mockScrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;

    try {
      await renderer.initialize(container, '<xml/>', {
        container: container,
        musicXml: '<xml/>',
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
        systemCount: container.querySelectorAll('g.system').length,
        measureCount: container.querySelectorAll('g.measure').length,
      }).toMatchSnapshot();
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  });
});
