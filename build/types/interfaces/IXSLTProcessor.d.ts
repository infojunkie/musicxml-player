/**
 * Interface for SaxonJS functionality to enable dependency injection
 * and future replacement of the SaxonJS library.
 */
export interface IXSLTProcessor {
    /**
     * Parse XML text into a document object
     */
    parse(options: {
        text: string;
    }): Promise<any>;
    /**
     * Evaluate XPath expression on a document
     */
    query(xpath: string, document: any): any;
    /**
     * Transform XML using XSLT
     */
    transform(stylesheet: string, source: string, params: Record<string, any>): Promise<string>;
}
//# sourceMappingURL=IXSLTProcessor.d.ts.map