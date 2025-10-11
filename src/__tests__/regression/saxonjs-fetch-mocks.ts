import createFetchMock from 'vitest-fetch-mock';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import SaxonJS from '../../saxon-js/SaxonJS3.rt';

export const serve = async (rel: string): Promise<string> => {
  const u = new URL(rel, import.meta.url);
  return readFile(fileURLToPath(u), 'utf8');
};

export function setupMocks(): void {
  const fetchMock = createFetchMock(vi);
  fetchMock.enableMocks();

  fetchMock.mockIf((req) => req.url.endsWith('timemap.sef.json'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: await serve('../fixtures/timemap.sef.json'),
  }));

  fetchMock.mockIf((req) => req.url.endsWith('smufl.json'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  }));

  fetchMock.mockIf((req) => req.url.endsWith('test-timemap.xsl'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: await serve('../fixtures/test-timemap.xsl'),
  }));

  // Serve an XSL that intentionally produces invalid JSON for parsing failure tests
  fetchMock.mockIf((req) => req.url.endsWith('invalid-timemap.xsl'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: await serve('../fixtures/invalid-timemap.xsl'),
  }));

  fetchMock.mockIf((req) => req.url.endsWith('unroll.xsl'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: await serve('../fixtures/test-unroll.xsl'),
  }));

  // Also map explicitly named test-unroll.xsl
  fetchMock.mockIf((req) => req.url.endsWith('test-unroll.xsl'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: await serve('../fixtures/test-unroll.xsl'),
  }));

  // Serve compiled SEF for unroll transform
  fetchMock.mockIf((req) => req.url.endsWith('unroll.sef.json'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: await serve('../fixtures/unroll.sef.json'),
  }));

  // Mock external MusicXML DTD to prevent network access during parsing
  fetchMock.mockIf((req) => /https?:\/\/(www\.)?musicxml\.org\/dtds\/partwise\.dtd$/i.test(req.url), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/xml-dtd' },
    body: '<!-- mocked MusicXML partwise DTD -->',
  }));

  // Serve an existing but invalid JSON file to trigger JSON.parse failures
  fetchMock.mockIf((req) => req.url.endsWith('invalid-sef.json'), async () => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: await serve('../fixtures/invalid-sef.json'),
  }));

  // @ts-ignore
  fetchMock.mockReject(() => new Error('Unexpected fetch'));

  const originalTransform = SaxonJS.transform as unknown as (
    options: any,
    mode?: 'sync' | 'async'
  ) => Promise<any> | any;

  // load local SEF fixtures for offline tests
  // url will be something like 'http://localhost:3000/src/__tests__/fixtures/unroll.sef.json'
  const resolveSefFixtureText = async (url: string): Promise<string | null> => {
    const filename = url.split('/').pop() || '';
    if (!filename) return null;
    return serve('../fixtures/' + filename.toLowerCase());
  };

  // Intercept SaxonJS.transform to bypass network for SEF packages
  // by supplying stylesheetText directly when requesting our fixtures
  SaxonJS.transform = (async (options: any, mode?: 'sync' | 'async') => {
    const loc: string | undefined = options?.stylesheetLocation;
    if (typeof loc === 'string') {
      // Short-circuit simple test XSL by returning a minimal, valid JSON timemap
      if (/test-timemap\.xsl$/i.test(loc)) {
        const principalResult = '[{"measure":1,"timestamp":0,"duration":1000}]';
        return { principalResult };
      }
      const text = await resolveSefFixtureText(loc);
      if (text) {
        const base = loc.slice(0, loc.lastIndexOf('/') + 1);
        const textResourcePool: Record<string, string> = {};
        // Preload sibling resource used by timemap flows via unparsed-text('unroll.sef.json')
        textResourcePool[`${base}unroll.sef.json`] = await serve('../fixtures/unroll.sef.json');
        textResourcePool['unroll.sef.json'] = textResourcePool[`${base}unroll.sef.json`];
        const patched = { ...options, stylesheetText: text };
        delete (patched as any).stylesheetLocation;
        (patched as any).stylesheetBaseURI = base;
        (patched as any).textResourcePool = {
          ...(options?.textResourcePool || {}),
          ...textResourcePool,
        };
        return originalTransform(patched, mode);
      }
    }
    return originalTransform(options, mode);
  }) as any;
}


