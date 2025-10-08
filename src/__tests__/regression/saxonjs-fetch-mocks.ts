import SaxonJS from '../../saxon-js/SaxonJS3.rt';
import type { TransformationOptions } from '../../saxon-js/SaxonJS3.rt'
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

/**
 * Read a test fixture relative to this module and return its UTF-8 text.
 * Keeps tests deterministic and avoids any external I/O.
 * @param relative_url relative URL (from this file) to a fixture, e.g. '../fixtures/unroll.sef.json'
 * @returns file contents as UTF-8 string
 */
async function serve(relative_url: string): Promise<string> {
  const url = new URL(relative_url, import.meta.url);
  return readFile(fileURLToPath(url), 'utf8');
};

/**
 * Map a SEF URL to the corresponding local fixture content.
 * @param url absolute URL or filename of a SEF (e.g., 'http://localhost:3000/src/__tests__/fixtures/unroll.sef.json' or 'unroll.sef.json')
 * @returns SEF JSON text if recognized, otherwise null
 */
export async function serveFixture(url: string): Promise<string> {
  const filename = url.slice(url.lastIndexOf('/') + 1);

  if (!filename) {
    throw new Error(`serveFixture: could not extract a filename from ${url}`);
  };

  // The developer has the responsibility to ensure the fixture exists
  return serve('../fixtures/' + filename.toLowerCase());
};

/**
 * SaxonJS test-time overrides:
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

    // Short-circuit simple timemap by returning a minimal JSON timemap we own.
    if (/test-timemap\.xsl$/i.test(stylesheet_location)) {
      const principalResult = await serveFixture('test-timemap.json')
      return { principalResult };
    }

    // Serve the requested stylesheet fixture
    const stylesheetText = await serveFixture(stylesheet_location);

    // @see https://www.saxonica.com/saxonjs/documentation3/index.html#!api/transform
    // paragraph 'Additional resources'
    // property 'textResourcePool'
    // Preloads the text of unroll.sef.json into SaxonJS’s textResourcePool so we have no network I/O.
    const textResourcePool: Record<string, string> = {
      // the key can be anything as long as it is unique
      unroll: await serveFixture('unroll.sef.json'),
    };

    const patched = {
      ...options,
      stylesheetText,
      textResourcePool
    };
    // remove any stylesheetLocation entry so we can force SaxonJS to use what we provide in textResourcePool
    delete (patched as any).stylesheetLocation;
    return originalTransform(patched, mode);
  }) as any;
}


