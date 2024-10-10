import type { IMidiFile } from 'midi-json-parser-worker';
import { VerovioToolkit } from 'verovio/esm';
import { VerovioOptions } from 'verovio';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
/**
 * Implementation of IMidiConverter that uses the Verovio library to convert a MusicXML file to MIDI and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertomidi and
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 */
export declare class VerovioConverter implements IMidiConverter {
    protected _vrv?: VerovioToolkit;
    protected _timemap: MeasureTimemap;
    protected _midi?: IMidiFile;
    protected _options: VerovioOptions;
    constructor(options?: VerovioOptions);
    initialize(musicXml: string): Promise<void>;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=VerovioConverter.d.ts.map