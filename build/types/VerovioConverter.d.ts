import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import type { VerovioOptionsFixed, VerovioToolkitFixed } from './VerovioBase';
import { VerovioBase } from './VerovioBase';
/**
 * Implementation of IMidiConverter that uses Verovio to convert a MusicXML file to MIDI and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertomidi and
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 */
export declare class VerovioConverter extends VerovioBase implements IMidiConverter {
    protected _vrv?: VerovioToolkitFixed;
    protected _timemap: MeasureTimemap;
    protected _midi?: ArrayBuffer;
    protected _options: VerovioOptionsFixed;
    constructor(options?: VerovioOptionsFixed);
    initialize(musicXml: string): Promise<void>;
    get midi(): ArrayBuffer;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=VerovioConverter.d.ts.map