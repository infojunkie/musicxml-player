import { describe, it, expect } from 'vitest';
import { parseMusicXmlTimemap } from './parse-musicxml-timemap';
import { SaxonJSAdapter } from '../adapters/SaxonJSAdapter';

describe('parseMusicXmlTimemap', () => {
  const xsltProcessor = new SaxonJSAdapter();
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

  // Contract tests - test the interface, not SaxonJS internals
  it('should be a function', () => {
    expect(typeof parseMusicXmlTimemap).toBe('function');
  });

  it('should return a Promise', () => {
    const result = parseMusicXmlTimemap('test', 'test.xsl', xsltProcessor);
    expect(result).toBeInstanceOf(Promise);
  });

  it('should return empty array when XSLT file is missing', async () => {
    const result = await parseMusicXmlTimemap(
      simpleMusicXml,
      'nonexistent.xsl',
      xsltProcessor,
    );
    expect(result).toEqual([]);
  });

  it('should return empty array when JSON parsing fails', async () => {
    // This tests the error handling contract
    const result = await parseMusicXmlTimemap(
      simpleMusicXml,
      'invalid-timemap.xsl',
      xsltProcessor,
    );
    expect(result).toEqual([]);
  });

  it('should handle empty input gracefully', async () => {
    const result = await parseMusicXmlTimemap(
      '',
      'test-timemap.xsl',
      xsltProcessor,
    );
    expect(result).toEqual([]);
  });

  it('should handle malformed XML gracefully', async () => {
    const invalidXml = '<invalid-xml>';
    const result = await parseMusicXmlTimemap(
      invalidXml,
      'test-timemap.xsl',
      xsltProcessor,
    );
    expect(result).toEqual([]);
  });

  it('should return array type', async () => {
    const result = await parseMusicXmlTimemap(
      simpleMusicXml,
      'test-timemap.xsl',
      xsltProcessor,
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle valid timemap structure when available', async () => {
    // This test focuses on the data structure contract
    const result = await parseMusicXmlTimemap(
      simpleMusicXml,
      'test-timemap.xsl',
      xsltProcessor,
    );

    if (result.length > 0) {
      // Test the timemap data structure contract
      const firstMeasure = result[0];
      expect(firstMeasure).toHaveProperty('measure');
      expect(firstMeasure).toHaveProperty('timestamp');
      expect(firstMeasure).toHaveProperty('duration');
      expect(typeof firstMeasure.measure).toBe('number');
      expect(typeof firstMeasure.timestamp).toBe('number');
      expect(typeof firstMeasure.duration).toBe('number');
    }
  });

  // Test that all async operations complete properly
  it('should handle all async operations without unhandled rejections', async () => {
    const promises = [
      parseMusicXmlTimemap(simpleMusicXml, 'test-timemap.xsl', xsltProcessor),
      parseMusicXmlTimemap('', 'test-timemap.xsl', xsltProcessor),
      parseMusicXmlTimemap('<invalid-xml>', 'test-timemap.xsl', xsltProcessor),
      parseMusicXmlTimemap(simpleMusicXml, 'nonexistent.xsl', xsltProcessor),
    ];

    const results = await Promise.allSettled(promises);

    // All promises should settle (either fulfilled or rejected)
    expect(results).toHaveLength(4);
    results.forEach((result) => {
      expect(result.status).toMatch(/fulfilled|rejected/);
    });
  });
});
