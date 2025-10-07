import type { IMIDIConverter, MeasureTimemap } from './IMIDIConverter';
import type { TimeMapEntryFixed } from './VerovioTypes';
import { VerovioConverterBase } from './VerovioConverterBase';
import { PlayerOptions } from './Player';
import type { IXSLTProcessor } from './interfaces/IXSLTProcessor';
/**
 * Implementation of IMIDIConverter that uses statically-rendered Verovio assets:
 * - MIDI file as obtained by `verovio --xml-id-checksum -t midi /path/to/score.musicxml`
 * - Timemap JSON file as obtained by `verovio --xml-id-checksum -t timemap --timemap-options '{ "includeMeasures": true, "includeRests": true }' /path/to/score.musicxml`
 */
export declare class VerovioStaticConverter extends VerovioConverterBase implements IMIDIConverter {
    protected _midiOrUri: ArrayBuffer | string;
    protected _timemapOrUri?: string | TimeMapEntryFixed[] | undefined;
    protected _timemap?: MeasureTimemap;
    protected _midi?: ArrayBuffer;
    protected _xsltProcessor: IXSLTProcessor;
    constructor(_midiOrUri: ArrayBuffer | string, _timemapOrUri?: string | TimeMapEntryFixed[] | undefined, xsltProcessor?: IXSLTProcessor);
    initialize(musicXml: string, options: Required<PlayerOptions>): Promise<void>;
    get midi(): ArrayBuffer;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=VerovioStaticConverter.d.ts.map