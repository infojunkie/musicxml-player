import type { IMIDIConverter, MeasureTimemap } from './interfaces/IMIDIConverter';
import type { VerovioOptionsFixed, VerovioToolkitFixed } from './VerovioTypes';
import { VerovioConverterBase } from './VerovioConverterBase';
import type { PlayerOptions } from './Player';
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
    constructor(options?: VerovioOptionsFixed);
    initialize(musicXml: string, options: Required<PlayerOptions>): Promise<void>;
    get midi(): ArrayBuffer;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=VerovioConverter.d.ts.map