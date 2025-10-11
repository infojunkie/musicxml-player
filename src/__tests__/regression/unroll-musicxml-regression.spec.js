import chai, { expect } from '@esm-bundle/chai';
import chaiAsPromised from '@esm-bundle/chai-as-promised';
import { unrollMusicXml } from '../../helpers/unroll-musicxml';
import { SaxonJSProcessor } from '../../SaxonJSProcessor';

chai.use(chaiAsPromised);

// Regression test suite to detect changes in SaxonJS API behavior
describe('unroll-musicxml regression', () => {
  const xsltProcessor = new SaxonJSProcessor();
  // Use real-world data from the author's repository
  const baiao_miranda_MusicXml = '../../demo/data/baiao-miranda.musicxml';
  
  describe('unrollMusicXml', () => {

    it('should maintain SaxonJS compatibility with real-world data', async () => {
      // Use the real-world SEF file that the project is designed to work with
      const unroll_uri = 'https://raw.githubusercontent.com/infojunkie/musicxml-midi/main/build/unroll.sef.json'

      const result = await unrollMusicXml(baiao_miranda_MusicXml, unroll_uri, xsltProcessor)

      console.log('Generated unrolled MusicXML length:', result.length)

      // Test the unrolled MusicXML data structure contract
      expect(result).to.be.a('string')
      expect(result.length).to.be.greaterThan(0)
      expect(result).to.not.equal(baiao_miranda_MusicXml) // Should be processed

      // Regression check: Verify the unrolled MusicXML maintains valid structure
      // This will fail if SaxonJS behavior changes unexpectedly
      expect(result).to.include('<?xml version="1.0"') // Should start with XML declaration
      expect(result).to.include('<score-partwise') // Should contain MusicXML root
      expect(result).to.include('</score-partwise>') // Should have proper closing tag
      
      // Verify it's still valid MusicXML structure
      expect(result).to.match(/<score-partwise[\s\S]*<\/score-partwise>/)
    });

    // These test the error handling contract
    describe("gracefully handles malformed XML", () => {
      it('should return original MusicXML when XSLT file is missing', async () => {
        const result = await unrollMusicXml(baiao_miranda_MusicXml, 'nonexistent.xsl', xsltProcessor)
        expect(result).to.equal(baiao_miranda_MusicXml)
      })

      it('should handle empty input gracefully', async () => {
        const result = await unrollMusicXml('', 'test-unroll.xsl', xsltProcessor)
        expect(result).to.equal('')
      })

      it('should handle malformed XML gracefully', async () => {
        const invalidXml = '<invalid-xml>'
        const result = await unrollMusicXml(invalidXml, 'test-unroll.xsl', xsltProcessor)
        expect(result).to.equal(invalidXml)
      })
    })
  });
});
