import SaxonJS from '../../saxon-js/SaxonJS3.rt';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

/**
 * Read a test fixture relative to this module and return its UTF-8 text.
 * Keeps tests deterministic and avoids any external I/O.
 * @param relative_url relative URL (from this file) to a fixture, e.g. '../fixtures/unroll.sef.json'
 * @returns file contents as UTF-8 string
 */
export const serve = async (relative_url: string): Promise<string> => {
  const url = new URL(relative_url, import.meta.url);
  return readFile(fileURLToPath(url), 'utf8');
};

/**
 * Install SaxonJS test-time overrides:
 * - Inline SEF packages via `stylesheetText` to avoid network fetches
 * - Provide a tiny JSON for `test-timemap.xsl` to keep the contract stable
 * - Seed `textResourcePool` and `stylesheetBaseURI` so `unparsed-text()` sibling lookups resolve
 */
export function setupSaxonMocks(): void {

  const originalTransform = SaxonJS.transform as unknown as (
    options: any,
    mode?: 'sync' | 'async'
  ) => Promise<any> | any;

  /**
   * Map a SEF URL to the corresponding local fixture content.
   * @param url absolute URL to the SEF (e.g., 'http://localhost:3000/src/__tests__/fixtures/unroll.sef.json')
   * @returns SEF JSON text if recognized, otherwise null
   */
  const resolveSefFixtureText = async (url: string): Promise<string | null> => {
    const filename = url.split('/').pop() || '';
    if (!filename) return null;
    return serve('../fixtures/' + filename.toLowerCase());
  };

  /**
   * Intercept SaxonJS.transform to:
   * - Return a minimal JSON directly when 'test-timemap.xsl' is requested
   * - Inject SEF JSON via `stylesheetText`, set base URI, and preload text resources
   * @param options original SaxonJS.transform options; we may replace `stylesheetLocation` with `stylesheetText`
   * @param mode 'sync' | 'async' execution mode passed through unchanged
   */
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
        // Base URI used by SaxonJS to resolve relative resources in the stylesheet
        const base = loc.slice(0, loc.lastIndexOf('/') + 1);
        // Additional text resources made available to `unparsed-text()` calls
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


