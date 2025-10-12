import { SaxonJSProcessor } from '../../SaxonJSProcessor';
import { parseMusicXmlTimemap } from '../../helpers/parse-musicxml-timemap';
import { setupSaxonMocks, serve } from './saxonjs-fetch-mocks';
import { unrollMusicXml } from '../../helpers/unroll-musicxml';

setupSaxonMocks();

describe('SaxonJS regression', () => {
  const xsltProcessor = new SaxonJSProcessor();
  const baiao_miranda_MusicXml = '../fixtures/baiao-miranda.musicxml';

  // no types are sometimes better than this nonsense
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // A spy so we can inspect console errors and assert against their messages
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('parseMusicxmlTimemap', () => {
    // Use simple XSL fixture for timemap tests
    const timemap_uri = new URL('test-timemap.xsl', import.meta.url).toString();

    describe('parseMusicXmlTimemap', () => {
      it('should maintain SaxonJS compatibility', async () => {
        // Load XML content from filesystem for a realistic input
        const xmlText = await serve(baiao_miranda_MusicXml);

        const result = await parseMusicXmlTimemap(xmlText, timemap_uri, xsltProcessor);

        // Catch console.error ahead of time so we know why the rest fails.
        expect(consoleErrorSpy).not.toHaveBeenCalled();

        // Test the timemap data structure contract
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        const firstMeasure = result[0];
        expect(firstMeasure).toHaveProperty('measure');
        expect(firstMeasure).toHaveProperty('timestamp');
        expect(firstMeasure).toHaveProperty('duration');
        expect(typeof firstMeasure.measure).toBe('number');
        expect(typeof firstMeasure.timestamp).toBe('number');
        expect(typeof firstMeasure.duration).toBe('number');
      });
      // @see https://www.saxonica.com/saxonjs/documentation3/index.html#!api/transform/error-handling
      describe('handles malformed XML', () => {
        it('should return empty array when XSL file is missing', async () => {
          const missing_xls = "nonexistent.xsl";

          const result = await parseMusicXmlTimemap(baiao_miranda_MusicXml, missing_xls, xsltProcessor);

          expect(result).toEqual([]);
          expect(consoleErrorSpy)
            .toHaveBeenCalledWith(
              // stupid regex to hide my local path
              expect.stringMatching(/^\[parseMusicXmlTimemap\] Error: ENOENT: no such file or directory, open '.*nonexistent\.xsl'$/)
            );
        });
        it('should return empty array when timemapXslUri produces invalid JSON', async () => {
          const spy = vi.spyOn(xsltProcessor, 'transform').mockResolvedValue({ principalResult: 'not-json' });

          const result = await parseMusicXmlTimemap(baiao_miranda_MusicXml, "not-json", xsltProcessor);

          expect(result).toEqual([]);
          expect(consoleErrorSpy)
            .toHaveBeenCalledWith("[parseMusicXmlTimemap] SyntaxError: Unexpected token 'o', \"not-json\" is not valid JSON");
          spy.mockRestore();
        });

        it('should handle empty input gracefully', async () => {
          const spy = vi.spyOn(xsltProcessor, 'transform').mockResolvedValue({ principalResult: '' } as any);
          const invalidXml = '';

          const result = await parseMusicXmlTimemap(invalidXml, 'test-timemap.xsl', xsltProcessor);

          expect(result).toEqual([]);
          expect(consoleErrorSpy)
            .toHaveBeenCalledWith("[parseMusicXmlTimemap] SyntaxError: Unexpected end of JSON input");
          spy.mockRestore();
        });

        it('should handle malformed XML gracefully', async () => {
          const spy = vi.spyOn(xsltProcessor, 'transform').mockResolvedValue({ principalResult: '<invalid-xml>' } as any);
          const invalidXml = '<invalid-xml>';

          const result = await parseMusicXmlTimemap(invalidXml, 'invalid-xml.xsl', xsltProcessor);

          expect(result).toEqual([]);
          expect(consoleErrorSpy)
            .toHaveBeenCalledWith("[parseMusicXmlTimemap] SyntaxError: Unexpected token '<', \"<invalid-xml>\" is not valid JSON");
          spy.mockRestore();
        });
      });
    });
  });

  describe('unrollMusicxml', () => {
    describe('unrollMusicXml', () => {
      it('should maintain SaxonJS compatibility', async () => {
        const unroll_uri = new URL('unroll.sef.json', import.meta.url).href;

        // Load XML content from filesystem for a realistic input
        const xmlText = await serve(baiao_miranda_MusicXml);

        const result = await unrollMusicXml(xmlText, unroll_uri, xsltProcessor);

        // Assert console.error was not called
        expect(consoleErrorSpy).not.toHaveBeenCalled();

        // Test the unrolled MusicXML data structure contract
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result).not.toBe(xmlText); // The output is processed when it's different from the input

        // INFO should we make sure it's valid xml? It's SaxonJS responsability.
        // Basic xml structure assertions
        expect(result).toContain('<?xml version="1.0"'); // Should start with XML declaration
        expect(result).toContain('<score-partwise'); // Should contain MusicXML root
        expect(result).toContain('</score-partwise>'); // Should have proper closing tag

        // Verify it's still valid MusicXML structure (basic regex)
        expect(result).toMatch(/<score-partwise[\s\S]*<\/score-partwise>/);

        // transformSpy.mockRestore();
      });
      // @see https://www.saxonica.com/saxonjs/documentation3/index.html#!api/transform/error-handling
      describe('handles malformed XML', () => {
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
});

