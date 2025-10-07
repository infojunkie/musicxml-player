import { describe, it, expect } from 'vitest';
import { unrollMusicXml } from './unroll-musicxml';
import { SaxonJSAdapter } from '../adapters/SaxonJSAdapter';

describe('unrollMusicXml', () => {
  const xsltProcessor = new SaxonJSAdapter();
  
  // Inline XSLT for testing (since SaxonJS needs to be able to fetch the files)
  const testXslContent = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes"/>
  
  <!-- Simple test XSLT that adds a comment to indicate processing -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>
  
  <!-- Add a comment at the beginning to show the transformation worked -->
  <xsl:template match="/*">
    <xsl:copy>
      <xsl:comment>Processed by test-unroll.xsl</xsl:comment>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>`

  const testRepeatXslContent = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes"/>
  
  <!-- Parameter to control measure renumbering -->
  <xsl:param name="renumberMeasures" select="false"/>
  
  <!-- Copy everything by default -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>
  
  <!-- Handle repeats by expanding them -->
  <xsl:template match="repeat">
    <!-- For testing, we'll just remove repeat elements and add a comment -->
    <xsl:comment>Repeat expanded</xsl:comment>
  </xsl:template>
  
  <!-- Handle measure renumbering -->
  <xsl:template match="measure">
    <xsl:copy>
      <xsl:choose>
        <xsl:when test="$renumberMeasures = true()">
          <!-- Renumber measures sequentially -->
          <xsl:attribute name="number">
            <xsl:value-of select="position()"/>
          </xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <!-- Keep original number -->
          <xsl:copy-of select="@*"/>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:apply-templates select="node()"/>
    </xsl:copy>
  </xsl:template>
  
  <!-- Add transformation marker -->
  <xsl:template match="/*">
    <xsl:copy>
      <xsl:comment>Processed by test-repeat-unroll.xsl with renumberMeasures=<xsl:value-of select="$renumberMeasures"/></xsl:comment>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>`
  
  const simpleMusicXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

  const musicXmlWithRepeats = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
      <repeat direction="forward"/>
    </measure>
    <measure number="3">
      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
    <measure number="4">
      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`



  // HAPPY PATH TESTS
  describe('Happy Path', () => {
    it('should call XSLT processor with correct parameters', async () => {
      // This test verifies that unrollMusicXml calls the XSLT processor with the expected interface
      const mockProcessor = {
        transform: async (options: any, mode: string) => {
          // Verify the parameters passed to the XSLT processor
          expect(options.stylesheetLocation).toBe('test.xsl')
          expect(options.sourceText).toBe(simpleMusicXml)
          expect(options.destination).toBe('serialized')
          expect(options.stylesheetParams.renumberMeasures).toBe(true)
          expect(mode).toBe('async')
          
          return { principalResult: 'transformed result' }
        }
      } as any

      const result = await unrollMusicXml(simpleMusicXml, 'test.xsl', mockProcessor)
      expect(result).toBe('transformed result')
    })

    it('should pass renumberMeasures parameter correctly', async () => {
      const mockProcessor = {
        transform: async (options: any, mode: string) => {
          expect(options.stylesheetParams.renumberMeasures).toBe(true)
          return { principalResult: 'renumbered result' }
        }
      } as any

      const result = await unrollMusicXml(musicXmlWithRepeats, 'test.xsl', mockProcessor)
      expect(result).toBe('renumbered result')
    })

    it('should handle successful XSLT transformation', async () => {
      const mockProcessor = {
        transform: async (options: any, mode: string) => {
          expect(options.sourceText).toBe(simpleMusicXml)
          expect(options.stylesheetLocation).toBe('valid.xsl')
          return { principalResult: 'successfully transformed' }
        }
      } as any

      const result = await unrollMusicXml(simpleMusicXml, 'valid.xsl', mockProcessor)
      expect(result).toBe('successfully transformed')
    })

    it('should handle MusicXML with repeats in successful transformation', async () => {
      const mockProcessor = {
        transform: async (options: any, mode: string) => {
          expect(options.sourceText).toBe(musicXmlWithRepeats)
          return { principalResult: 'repeats expanded' }
        }
      } as any

      const result = await unrollMusicXml(musicXmlWithRepeats, 'repeat-processor.xsl', mockProcessor)
      expect(result).toBe('repeats expanded')
    })
  })

  // ERROR HANDLING TESTS
  describe('Error Handling', () => {
    it('should handle missing XSLT file gracefully', async () => {
      const result = await unrollMusicXml(simpleMusicXml, 'nonexistent.xsl', xsltProcessor)
      expect(result).toBe(simpleMusicXml) // Should return original on error
    })

    it('should handle XSLT transformation errors gracefully', async () => {
      const result = await unrollMusicXml(simpleMusicXml, 'nonexistent.xsl', xsltProcessor)
      
      expect(result).toBeDefined()
      expect(result).toBe(simpleMusicXml) // Should return original on error
    })

    it('should handle MusicXML with repeats when XSLT fails', async () => {
      const result = await unrollMusicXml(musicXmlWithRepeats, 'nonexistent.xsl', xsltProcessor)
      
      expect(result).toBeDefined()
      expect(result).toBe(musicXmlWithRepeats) // Should return original on error
    })

    it('should preserve measure structure when transformation fails', async () => {
      const result = await unrollMusicXml(musicXmlWithRepeats, 'nonexistent.xsl', xsltProcessor)
      
      // Count measures in original and result
      const originalMeasureCount = (musicXmlWithRepeats.match(/<measure/g) || []).length
      const resultMeasureCount = (result.match(/<measure/g) || []).length
      
      expect(resultMeasureCount).toBe(originalMeasureCount) // Should be same when transformation fails
    })

    it('should handle empty input gracefully', async () => {
      const result = await unrollMusicXml('', 'nonexistent.xsl', xsltProcessor)
      expect(result).toBe('')
    })

    it('should handle malformed XML gracefully', async () => {
      const invalidXml = '<invalid-xml>'
      const result = await unrollMusicXml(invalidXml, 'nonexistent.xsl', xsltProcessor)
      expect(result).toBe(invalidXml) // Should return original on error
    })

    it('should complete all async operations without unhandled rejections', async () => {
      const promises = [
        unrollMusicXml(simpleMusicXml, 'nonexistent.xsl', xsltProcessor),
        unrollMusicXml(musicXmlWithRepeats, 'nonexistent.xsl', xsltProcessor),
        unrollMusicXml('', 'nonexistent.xsl', xsltProcessor),
        unrollMusicXml('<invalid-xml>', 'nonexistent.xsl', xsltProcessor),
        unrollMusicXml(simpleMusicXml, 'nonexistent.xsl', xsltProcessor)
      ]

      const results = await Promise.allSettled(promises)

      // All promises should settle (either fulfilled or rejected)
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result.status).toMatch(/fulfilled|rejected/)
      })
      
      // All should succeed (graceful error handling)
      results.forEach(result => {
        expect(result.status).toBe('fulfilled')
      })
    })
  })
})
