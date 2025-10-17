import SaxonJS from './saxon-js/SaxonJS3.rt';
import type { IXSLTProcessor } from './interfaces/IXSLTProcessor';

/**
 * Concrete implementation of IXSLTProcessor using the actual SaxonJS library
 */
export class SaxonJSProcessor implements IXSLTProcessor {
  async parse(options: { text: string }): Promise<any> {
    return SaxonJS.getResource({
      ...options,
      type: 'xml',
      encoding: 'utf8',
    });
  }

  query(xpath: string, document: any): any {
    return SaxonJS.XPath.evaluate(xpath, document);
  }

  async transform(
    stylesheet: string,
    source: string,
    params: Record<string, any>,
  ): Promise<string> {
    const result = await SaxonJS.transform(
      {
        stylesheetLocation: stylesheet,
        sourceText: source,
        destination: 'serialized',
        stylesheetParams: params,
      },
      'async',
    );
    return result.principalResult;
  }
}
