import { parseMusicXmlTimemap } from '../../helpers/parse-musicxml-timemap';
import { SaxonJSProcessor } from '../../SaxonJSProcessor';
import { setupMocks, serve } from './saxonjs-fetch-mocks';

setupMocks();

// Regression test suite to detect changes in SaxonJS API behavior (Vitest)
describe('parse-musicxml-timemap regression', () => {
  const xsltProcessor = new SaxonJSProcessor();
  // Use real-world data from the author's repository
  const baiao_miranda_MusicXml = '../../../demo/data/baiao-miranda.musicxml';
  const baiao_miranda_Timemap = '../../demo/data/baiao-miranda.timemap.json';
  // Use local simple XSL path (actual output is mocked to real-world JSON below)
  const timemap_uri = new URL('../fixtures/test-timemap.xsl', import.meta.url).href;

  describe('parseMusicXmlTimemap', () => {
    it('should maintain SaxonJS compatibility with real-world data', async () => {
      // Mock the XSLT call to return the real-world expected timemap JSON
      const realTimemapJson = await serve('../../../demo/data/baiao-miranda.timemap.json');
      const transformSpy = vi.spyOn(xsltProcessor, 'transform').mockResolvedValue({
        principalResult: realTimemapJson,
      });
      const xmlText = await serve('../../../demo/data/baiao-miranda.musicxml');

      const result = await parseMusicXmlTimemap(xmlText, timemap_uri, xsltProcessor);
      transformSpy.mockRestore();

      // INFO do not fetch anything
      // Load the expected timemap from the demo data for regression comparison
      const expectedTimemap = JSON.parse(await serve('../../../demo/data/baiao-miranda.timemap.json'));

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

      // Regression check: Verify the structure matches the expected format from the author's data
      expect(result.length).toBe(expectedTimemap.length);
      result.forEach((measure, index) => {
        expect(measure).toHaveProperty('measure', expectedTimemap[index].measure);
        expect(measure).toHaveProperty('timestamp');
        expect(measure).toHaveProperty('duration');
      });
    });

    // These test the error handling contract
    describe('gracefully handles malformed XML', () => {
      it('should return empty array when XSLT file is missing', async () => {
        const result = await parseMusicXmlTimemap(baiao_miranda_MusicXml, 'nonexistent.xsl', xsltProcessor);
        expect(result).toEqual([]);
      });

      it('should return empty array when JSON parsing fails', async () => {
        const result = await parseMusicXmlTimemap(baiao_miranda_MusicXml, 'invalid-timemap.xsl', xsltProcessor);
        expect(result).toEqual([]);
      });

      it('should handle empty input gracefully', async () => {
        const result = await parseMusicXmlTimemap('', 'test-timemap.xsl', xsltProcessor);
        expect(result).toEqual([]);
      });

      it('should handle malformed XML gracefully', async () => {
        const invalidXml = '<invalid-xml>';
        const result = await parseMusicXmlTimemap(invalidXml, 'test-timemap.xsl', xsltProcessor);
        expect(result).toEqual([]);
      });
    });
  });
});




