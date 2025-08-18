import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import { TimeMapEntryFixed, VerovioBase } from './VerovioBase';
/**
 * Implementation of IMidiConverter that uses statically-rendered Verovio assets:
 * - MIDI file as obtained by `verovio --xml-id-checksum -t midi /path/to/score.musicxml`
 * - Timemap JSON file as obtained by `verovio --xml-id-checksum -t timemap --timemap-options '{ "includeMeasures": true, "includeRests": true }' /path/to/score.musicxml`
 */
export declare class VerovioStaticConverter extends VerovioBase implements IMidiConverter {
    protected _midiOrUri: ArrayBuffer | string;
    protected _timemapOrUri?: string | TimeMapEntryFixed[] | undefined;
    protected _timemap?: MeasureTimemap;
    protected _midi?: ArrayBuffer;
    constructor(_midiOrUri: ArrayBuffer | string, _timemapOrUri?: string | TimeMapEntryFixed[] | undefined);
    initialize(musicXml: string): Promise<void>;
    get midi(): ArrayBuffer;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=VerovioStaticConverter.d.ts.map