import SaxonJS from '../../saxon-js/SaxonJS3.rt';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import type { TransformationOptions } from '../../saxon-js/SaxonJS3.rt'

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

  // WARNING
  // Cannot use the actual type definition from SaxonJS3.rt.d.ts because of mismatched signatures
  // do we want execution or mode ?
  // cf: src/saxon-js/SaxonJS3.rt.d.ts line 166
  // cf: src/SaxonJSProcessor.ts line 29
  const originalTransform = SaxonJS.transform as unknown as (
    options: TransformationOptions,
    mode?: 'sync' | 'async'
  ) => Promise<any> | any;

  /**
   * Map a SEF URL to the corresponding local fixture content.
   * @param url absolute URL to the SEF (e.g., 'http://localhost:3000/src/__tests__/fixtures/unroll.sef.json')
   * @returns SEF JSON text if recognized, otherwise null
   */
  const serveFixture = async (url: string): Promise<string> => {
    const filename = url.slice(url.lastIndexOf('/') + 1);

    if (!filename) {
      throw new Error(`serveFixture: could not extract a filename from ${url}`);
    };

    // The developer has the responsibility to ensure the fixture exists
    return serve('../fixtures/' + filename.toLowerCase());
  };

  /**
   * Intercept SaxonJS.transform to:
   * - Return a minimal JSON directly when 'test-timemap.xsl' is requested
   * - Inject SEF JSON via `stylesheetText`, set base URI, and preload text resources.
   * @param options original SaxonJS.transform options; we may replace `stylesheetLocation` with `stylesheetText`
   * @param mode 'sync' | 'async' execution mode passed through unchanged
   */
  SaxonJS.transform = (async (options: any, mode?: 'sync' | 'async') => {
    const stylesheet_location: string | undefined = options?.stylesheetLocation;
    // return with the default implementation
    // as no stylesheet location was requested
    if (typeof stylesheet_location !== "string") {
      return originalTransform(options, mode);
    }

    // Short-circuit simple test XSL by returning a minimal JSON timemap.
    if (/test-timemap\.xsl$/i.test(stylesheet_location)) {
      const principalResult = await serveFixture('test-timemap.json')
      return { principalResult };
    }

    const stylesheet_text = await serveFixture(stylesheet_location);

    // basepath is used by SaxonJS to resolve relative resources in the stylesheet
    const basepath = stylesheet_location.slice(0, stylesheet_location.lastIndexOf('/') + 1);

    // Additional text resources made available to `unparsed-text()` calls
    const textResourcePool: Record<string, string> = {};
    // Preload the 'unroll.sef.json' text so Saxon can resolve both:
    // - absolute URI: `${basepath}unroll.sef.json`
    // - relative name: 'unroll.sef.json'
    const preloadedUnrollName = 'unroll.sef.json';
    const preloadedUnrollUrl = `${basepath}${preloadedUnrollName}`;
    const preloadedUnrollText = await serveFixture(preloadedUnrollName) as string;
    textResourcePool[preloadedUnrollUrl] = preloadedUnrollText;
    textResourcePool[preloadedUnrollName] = preloadedUnrollText;



    const patched = { ...options, stylesheetText: stylesheet_text };
    delete (patched as any).stylesheetLocation;
    (patched as any).stylesheetBaseURI = basepath;
    (patched as any).textResourcePool = {
      ...(options?.textResourcePool || {}),
      ...textResourcePool,
    };
    return originalTransform(patched, mode);
  }) as any;
}


