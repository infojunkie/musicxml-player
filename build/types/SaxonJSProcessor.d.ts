import type { IXSLTProcessor } from './interfaces/IXSLTProcessor';
/**
 * Concrete implementation of IXSLTProcessor using the actual SaxonJS library
 */
export declare class SaxonJSProcessor implements IXSLTProcessor {
    parse(options: {
        text: string;
    }): Promise<any>;
    query(xpath: string, document: any): any;
    transform(stylesheet: string, source: string, params: Record<string, any>): Promise<string>;
}
//# sourceMappingURL=SaxonJSProcessor.d.ts.map