import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
/**
 * Implementation of IMidiConverter that uses the Verovio library to convert a MusicXML file to MIDI and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertomidi and
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 *
 * At this time, this converter does not handle repeats and jumps, so either:
 * - Use this converter when you are sure that the MusicXML contains no repeats or jumps
 * - Pre-unroll the score, e.g. using musicxml-mma's musicxml-unroll transformation
 *   @see https://github.com/infojunkie/musicxml-mma/blob/main/musicxml-unroll.xsl
 *
 * You can also participate in the discussion on the Verovio repo
 * @see https://github.com/rism-digital/verovio/issues/235
 *
 */
export declare class VerovioConverter implements IMidiConverter {
    private _unroll;
    private _vrv;
    private _timemap;
    private _midi;
    constructor(_unroll?: boolean);
    initialize(musicXml: string): Promise<void>;
    get midi(): IMidiFile;
    get timemap(): MeasureTimemap;
    get version(): string;
    private static _base64ToArrayBuffer;
}
//# sourceMappingURL=VerovioConverter.d.ts.map