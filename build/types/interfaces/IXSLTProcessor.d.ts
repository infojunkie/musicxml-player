/**
 * Interface for SaxonJS functionality to enable dependency injection
 * and future replacement of the SaxonJS library.
 */
export interface IXSLTProcessor {
    /**
     * Parse XML text into a document object
     */
    getResource(options: {
        type: 'xml';
        encoding: string;
        text: string;
    }): Promise<any>;
    /**
     * Evaluate XPath expression on a document
     */
    XPath: {
        evaluate(xpath: string, document: any): any;
    };
    /**
     * Transform XML using XSLT
     */
    transform(options: {
        stylesheetLocation: string;
        sourceText: string;
        destination: 'serialized' | 'replaceBody' | 'appendToBody' | 'prependToBody' | 'raw' | 'document' | 'application' | 'file' | 'stdout';
        stylesheetParams?: Record<string, any>;
    }, mode: 'sync' | 'async'): Promise<{
        principalResult: string;
    }>;
}
//# sourceMappingURL=IXSLTProcessor.d.ts.map