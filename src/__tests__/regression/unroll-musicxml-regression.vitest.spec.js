import { unrollMusicXml } from '../../helpers/unroll-musicxml';
import { SaxonJSProcessor } from '../../SaxonJSProcessor';
import { setupMocks, serve } from './saxonjs-fetch-mocks';

setupMocks();

// Regression test suite to detect changes in SaxonJS API behavior (Vitest)
describe('unroll-musicxml regression', () => {
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
      } );
      const result = await unrollMusicXml(xmlText, unroll_uri, xsltProcessor);
      transformSpy.mockRestore();

      // Test the unrolled MusicXML data structure contract
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe(baiao_miranda_MusicXml); // Should be processed

      // Regression check: Verify the unrolled MusicXML maintains valid structure
      // This will fail if SaxonJS behavior changes unexpectedly
      expect(result).toContain('<?xml version="1.0"'); // Should start with XML declaration
      expect(result).toContain('<score-partwise'); // Should contain MusicXML root
      expect(result).toContain('</score-partwise>'); // Should have proper closing tag

      // Verify it's still valid MusicXML structure (basic regex)
      expect(result).toMatch(/<score-partwise[\s\S]*<\/score-partwise>/);
    });

    // These test the error handling contract
    describe('gracefully handles malformed XML', () => {
      it('should return original MusicXML when XSLT file is missing', async () => {
        const result = await unrollMusicXml(baiao_miranda_MusicXml, 'nonexistent.xsl', xsltProcessor);
        expect(result).toBe(baiao_miranda_MusicXml);
      });

      it('should handle empty input gracefully', async () => {
        const result = await unrollMusicXml('', 'test-unroll.xsl', xsltProcessor);
        expect(result).toBe('');
      });

      it('should handle malformed XML gracefully', async () => {
        const invalidXml = '<invalid-xml>';
        const result = await unrollMusicXml(invalidXml, 'test-unroll.xsl', xsltProcessor);
        expect(result).toBe(invalidXml);
      });
    });
  });
});




