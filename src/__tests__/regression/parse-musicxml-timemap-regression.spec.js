import chai, { expect } from '@esm-bundle/chai';
import chaiAsPromised from '@esm-bundle/chai-as-promised';
import { parseMusicXmlTimemap } from '../../helpers/parse-musicxml-timemap';
import { SaxonJSProcessor } from '../../SaxonJSProcessor';

chai.use(chaiAsPromised);

// Regression test suite to detect changes in SaxonJS API behavior
describe('parse-musicxml-timemap regression', () => {
  const xsltProcessor = new SaxonJSProcessor();
  // Use real-world data from the author's repository
  const baiao_miranda_MusicXml = '../../demo/data/baiao-miranda.musicxml';
  const baiao_miranda_Timemap = '../../demo/data/baiao-miranda.timemap.json';

  describe('parseMusicXmlTimemap', () => {

    it('should maintain SaxonJS compatibility with real-world data', async () => {
      // Use the real-world SEF file that the project is designed to work with
      const timemap_uri = 'https://raw.githubusercontent.com/infojunkie/musicxml-midi/main/build/timemap.sef.json'

      const result = await parseMusicXmlTimemap(baiao_miranda_MusicXml, timemap_uri, xsltProcessor)

      console.log('Generated timemap:', result)

      // Load the expected timemap from the author's repository for regression comparison
      const expectedTimemap = await fetch(baiao_miranda_Timemap).then(r => r.json())
      console.log('Expected timemap:', expectedTimemap)

      // Test the timemap data structure contract
      expect(result).to.be.an('array')
      expect(result.length).to.be.greaterThan(0)

      const firstMeasure = result[0]
      expect(firstMeasure).to.have.property('measure')
      expect(firstMeasure).to.have.property('timestamp')
      expect(firstMeasure).to.have.property('duration')
      expect(typeof firstMeasure.measure).toBe('number')
      expect(typeof firstMeasure.timestamp).toBe('number')
      expect(typeof firstMeasure.duration).toBe('number')

      // Regression check: Verify the structure matches the expected format from the author's data
      // This will fail if SaxonJS behavior changes unexpectedly
      expect(result.length).to.equal(expectedTimemap.length)
      result.forEach((measure, index) => {
        expect(measure).to.have.property('measure', expectedTimemap[index].measure)
        expect(measure).to.have.property('timestamp')
        expect(measure).to.have.property('duration')
      })
    });

    // These test the error handling contract
    describe("gracefully handles malformed XML", () => {
      it('should return empty array when XSLT file is missing', async () => {
        const result = await parseMusicXmlTimemap(baiao_miranda_MusicXml, 'nonexistent.xsl', xsltProcessor)
        expect(result).to.deep.equal([])
      })

      it('should return empty array when JSON parsing fails', async () => {
        const result = await parseMusicXmlTimemap(baiao_miranda_MusicXml, 'invalid-timemap.xsl', xsltProcessor)
        expect(result).to.deep.equal([])
      })

      it('should handle empty input gracefully', async () => {
        const result = await parseMusicXmlTimemap('', 'test-timemap.xsl', xsltProcessor)
        expect(result).to.deep.equal([])
      })

      it('should handle malformed XML gracefully', async () => {
        const invalidXml = '<invalid-xml>'
        const result = await parseMusicXmlTimemap(invalidXml, 'test-timemap.xsl', xsltProcessor)
        expect(result).to.deep.equal([])
      })
    })
  });
});
