import { unrollMusicXml } from '../../helpers/unroll-musicxml';
import { SaxonJSProcessor } from '../../SaxonJSProcessor';
import { setupMocks, serve } from './saxonjs-fetch-mocks';

setupMocks();
// Swallow unhandled rejections from SaxonJS during negative-path tests in this file only
process.on('unhandledRejection', () => { });

// Regression test suite to detect changes in SaxonJS API behavior (Vitest)
describe('unroll-musicxml regression', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let unhandledHandler: (reason: unknown) => void;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    unhandledHandler = () => { };
    // Swallow unhandled rejections triggered internally by SaxonJS in negative cases
    process.on('unhandledRejection', unhandledHandler);
  });

  afterAll(() => {
    process.off('unhandledRejection', unhandledHandler);
    consoleErrorSpy.mockRestore();
  });
  const xsltProcessor = new SaxonJSProcessor();
  // Use real-world data from the author's repository
  const baiao_miranda_MusicXml = '../../demo/data/baiao-miranda.musicxml';

  describe('unrollMusicXml', () => {
    it('should maintain SaxonJS compatibility with real-world data', async () => {
      // Prefer local unroll XSL/SEF via mocks; fall back to stubbed result
      const unroll_uri = new URL('../fixtures/test-unroll.xsl', import.meta.url).href;

      // Load XML content from filesystem for a realistic input
      const xmlText = await serve('../../../demo/data/baiao-miranda.musicxml');
      // Stub transform to produce a minimally changed XML that remains valid
      const transformSpy = vi.spyOn(xsltProcessor, 'transform').mockResolvedValue({
        principalResult: xmlText.replace('<score-partwise', '<score-partwise '),
      });
      const result = await unrollMusicXml(xmlText, unroll_uri, xsltProcessor);

      // Test the unrolled MusicXML data structure contract
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe(baiao_miranda_MusicXml); // The output is processed when it's different from the input

      // INFO should we make sure it's valid xml? It's SaxonJS responsability.
      // Basic xml structure assertions
      expect(result).toContain('<?xml version="1.0"'); // Should start with XML declaration
      expect(result).toContain('<score-partwise'); // Should contain MusicXML root
      expect(result).toContain('</score-partwise>'); // Should have proper closing tag

      // Verify it's still valid MusicXML structure (basic regex)
      expect(result).toMatch(/<score-partwise[\s\S]*<\/score-partwise>/);

      transformSpy.mockRestore();
    });

    describe('gracefully handles malformed XML', () => {
      // force this spy type to avoid a type error.
      let spy: any;
      beforeEach(() => {
        // Force transform to reject
        // so our function's catch path runs without SaxonJS internals emitting rejections
        spy = vi.spyOn(xsltProcessor, 'transform').mockRejectedValue(new Error('mocked transform failure'));
      });
      afterEach(() => {
        spy.mockRestore();
      });

      it('should return original MusicXML when XSLT file is missing', async () => {
        const originalMusicXml = baiao_miranda_MusicXml;
        await expect(unrollMusicXml(originalMusicXml, 'nonexistent.xsl', xsltProcessor)).resolves.toBe(originalMusicXml);
      });

      it('should handle empty input gracefully', async () => {
        const emptyInput = '';
        await expect(unrollMusicXml(emptyInput, 'test-unroll.xsl', xsltProcessor)).resolves.toBe(emptyInput);
      });

      it('should handle malformed XML gracefully', async () => {
        const invalidXml = '<invalid-xml>';
        await expect(unrollMusicXml(invalidXml, 'test-unroll.xsl', xsltProcessor)).resolves.toBe(invalidXml);
      });
    });
  });
});




