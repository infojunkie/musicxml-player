import type { IMIDIConverter, MeasureTimemap } from './IMIDIConverter';
import type { VerovioOptionsFixed, VerovioToolkitFixed } from './VerovioTypes';
import { VerovioConverterBase } from './VerovioConverterBase';
import type { PlayerOptions } from './Player';
import type { IXSLTProcessor } from './interfaces/IXSLTProcessor';
/**
 * Implementation of IMIDIConverter that uses Verovio to convert a MusicXML file to MIDI and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertomidi and
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 */
export declare class VerovioConverter extends VerovioConverterBase implements IMIDIConverter {
    protected _vrv?: VerovioToolkitFixed;
    protected _timemap: MeasureTimemap;
    protected _midi?: ArrayBuffer;
    protected _options: VerovioOptionsFixed;
    protected _xsltProcessor: IXSLTProcessor;
    constructor(options?: VerovioOptionsFixed, xsltProcessor?: IXSLTProcessor);
    initialize(musicXml: string, options: Required<PlayerOptions>): Promise<void>;
    get midi(): ArrayBuffer;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=VerovioConverter.d.ts.map