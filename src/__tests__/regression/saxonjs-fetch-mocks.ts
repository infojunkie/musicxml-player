import SaxonJS from '../../saxon-js/SaxonJS3.rt';
import createFetchMock from 'vitest-fetch-mock';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

export const serve = async (rel: string): Promise<string> => {
  const u = new URL(rel, import.meta.url);
  return readFile(fileURLToPath(u), 'utf8');
};

export function setupSaxonMocks(): void {

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


