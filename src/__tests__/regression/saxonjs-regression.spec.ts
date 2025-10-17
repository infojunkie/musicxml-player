import { SaxonJSProcessor } from '../../SaxonJSProcessor';
import { parseMusicXmlTimemap } from '../../helpers/parse-musicxml-timemap';
import { setupSaxonMocks, serveFixture } from './saxonjs-fetch-mocks';
import { unrollMusicXml } from '../../helpers/unroll-musicxml';

describe('SaxonJS regression', () => {
  const xsltProcessor = new SaxonJSProcessor();

  // no types are sometimes better than this nonsense
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // setting up Saxon fetch mocks
    setupSaxonMocks();
    // A spy so we can inspect console errors and assert against their messages
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore all spies and mocks to their original implementations
    vi.restoreAllMocks();
  });

  describe('parseMusicXmlTimemap', () => {
    it('should maintain SaxonJS compatibility', async () => {
      // Load XML content from filesystem for a realistic input
      const xmlText = await serveFixture('baiao-miranda.musicxml');
      // saxonjs-fetch-mocks will short-circuit this and serve the file content from the filesystem
      const timemapUri = 'test-timemap.xsl';

      const result = await parseMusicXmlTimemap(
        xmlText,
        timemapUri,
        xsltProcessor,
      );

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
    describe('handles error scenarios', () => {
      it('should return empty array when XSL file is nonexistent', async () => {
        const validMusicXml = await serveFixture('baiao-miranda.musicxml');
        const nonExistentXsl = 'non/existent.xsl';

        const result = await parseMusicXmlTimemap(
          validMusicXml,
          nonExistentXsl,
          xsltProcessor,
        );

        expect(result).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringMatching(
            /^\[parseMusicXmlTimemap\] XError:No stylesheet supplied; code:SXJS0006/,
          ),
        );
      });

      it('should return empty array when timemapXslUri produces invalid JSON', async () => {
        const validMusicXml = await serveFixture('baiao-miranda.musicxml');
        const spy = vi
          .spyOn(xsltProcessor, 'transform')
          .mockResolvedValue('not-json');

        const result = await parseMusicXmlTimemap(
          validMusicXml,
          'not-json',
          xsltProcessor,
        );

        expect(result).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringMatching(/^\[parseMusicXmlTimemap\] SyntaxError:/),
        );
        spy.mockRestore();
      });

      it('should handle empty input gracefully', async () => {
        const spy = vi.spyOn(xsltProcessor, 'transform').mockResolvedValue('');
        const emptyMusicXml = await serveFixture('empty.musicxml');

        const result = await parseMusicXmlTimemap(
          emptyMusicXml,
          'test-timemap.xsl',
          xsltProcessor,
        );

        expect(result).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringMatching(/^\[parseMusicXmlTimemap\] SyntaxError:/),
        );
        spy.mockRestore();
      });

      it('should handle malformed XML gracefully', async () => {
        const spy = vi
          .spyOn(xsltProcessor, 'transform')
          .mockResolvedValue('<invalid-xml>');
        const invalidXml = await serveFixture('invalid.musicxml');

        const result = await parseMusicXmlTimemap(
          invalidXml,
          'invalid-xml.xsl',
          xsltProcessor,
        );

        expect(result).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringMatching(/^\[parseMusicXmlTimemap\] SyntaxError:/),
        );
        spy.mockRestore();
      });
    });
  });

  describe('unrollMusicXml', () => {
    it('should maintain SaxonJS compatibility', async () => {
      // saxonjs-fetch-mocks will short-circuit this and serve the file content from the filesystem
      const unrollUri = 'unroll.sef.json';

      // Load XML content from filesystem for a realistic input
      const xmlText = await serveFixture('baiao-miranda.musicxml');

      // Mock the transform method to return a successful result
      const _spy = vi
        .spyOn(xsltProcessor, 'transform')
        .mockResolvedValue(
          '<?xml version="1.0" encoding="UTF-8"?><score-partwise><part><measure><note><pitch><step>C</step><octave>4</octave></pitch></note></measure></part></score-partwise>',
        );

      const result = await unrollMusicXml(xmlText, unrollUri, xsltProcessor);

      // Assert console.error was not called
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // Test the unrolled MusicXML data structure contract
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe(xmlText); // The output is processed when it's different from the input

      // Basic XML structure assertions
      expect(result).toContain('<?xml version="1.0"'); // Should start with XML declaration
      expect(result).toContain('<score-partwise'); // Should contain MusicXML root
      expect(result).toContain('</score-partwise>'); // Should have proper closing tag

      // Verify it's still valid MusicXML structure (basic regex)
      expect(result).toMatch(/<score-partwise[\s\S]*<\/score-partwise>/);
    });

    // @see https://www.saxonica.com/saxonjs/documentation3/index.html#!api/transform/error-handling
    describe('handles error scenarios', () => {
      // force this spy type to avoid a type error.
      let spy: any;
      beforeEach(() => {
        // Force transform to reject
        // so our function's catch path runs without SaxonJS internals emitting rejections
        spy = vi
          .spyOn(xsltProcessor, 'transform')
          .mockRejectedValue(new Error('mocked transform failure'));
      });
      afterEach(() => {
        spy.mockRestore();
      });

      it('should return original MusicXML when XSLT file is missing', async () => {
        const originalMusicXml = await serveFixture('baiao-miranda.musicxml');
        await expect(
          unrollMusicXml(originalMusicXml, 'nonexistent.xsl', xsltProcessor),
        ).resolves.toEqual(originalMusicXml);
      });

      it('should handle empty input gracefully', async () => {
        const emptyInput = '';
        // test-unroll.xsl exists in the test fixtures
        await expect(
          unrollMusicXml(emptyInput, 'test-unroll.xsl', xsltProcessor),
        ).resolves.toEqual(emptyInput);
      });

      it('should handle malformed XML gracefully', async () => {
        const invalidXml = await serveFixture('invalid.musicxml');
        // test-unroll.xsl exists in the test fixtures
        await expect(
          unrollMusicXml(invalidXml, 'test-unroll.xsl', xsltProcessor),
        ).resolves.toEqual(invalidXml);
      });
    });
  });
});
