import SaxonJS from '../saxon-js/SaxonJS3.rt';
import type { IXSLTProcessor } from '../interfaces/IXSLTProcessor';
/**
 * Concrete implementation of IXSLTProcessor using the actual SaxonJS library
 */
export declare class SaxonJSAdapter implements IXSLTProcessor {
    getResource(options: {
        type: 'xml';
        encoding: string;
        text: string;
    }): Promise<any>;
    get XPath(): typeof SaxonJS.XPath;
    transform(options: {
        stylesheetLocation: string;
        sourceText: string;
        destination: 'serialized' | 'replaceBody' | 'appendToBody' | 'prependToBody' | 'raw' | 'document' | 'application' | 'file' | 'stdout';
        stylesheetParams?: Record<string, any>;
    }, mode: 'sync' | 'async'): Promise<{
        principalResult: string;
    }>;
}
//# sourceMappingURL=SaxonJSAdapter.d.ts.map