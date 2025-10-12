import SaxonJS from './saxon-js/SaxonJS3.rt';
import type { IXSLTProcessor } from './interfaces/IXSLTProcessor';

/**
 * Concrete implementation of IXSLTProcessor using the actual SaxonJS library
 */
export class SaxonJSProcessor implements IXSLTProcessor {
  async getResource(options: {
    type: 'xml';
    encoding: string;
    text: string;
  }): Promise<any> {
    // WARNING await has no effect on the type of this expression
    return await SaxonJS.getResource(options);
  }

  get XPath() {
    return SaxonJS.XPath;
  }

  async transform(
    options: {
      stylesheetLocation: string;
      sourceText: string;
      destination: 'serialized' | 'replaceBody' | 'appendToBody' | 'prependToBody' | 'raw' | 'document' | 'application' | 'file' | 'stdout';
      stylesheetParams?: Record<string, any>;
    },
    // WARNING
    // type mismatch between SaxonJS3.rt.d.ts and SaxonJSProcessor.ts
    // do we want execution or mode ?
    // cf: src/saxon-js/SaxonJS3.rt.d.ts line 166
    // cf: src/__tests__/regression/saxonjs-fetch-mocks.ts line 25
    mode: 'sync' | 'async'
  ): Promise<{ principalResult: string }> {
    return await SaxonJS.transform(options, mode);
  }
}


