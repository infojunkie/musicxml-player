import type { IMIDIConverter, MeasureTimemap } from './IMIDIConverter';
import { PlayerOptions } from './Player';
import type { IXSLTProcessor } from './interfaces/IXSLTProcessor';
/**
 * Implementation of IMIDIConverter that queries the musicxml-midi API (@see https://github.com/infojunkie/musicxml-midi)
 * to convert a MusicXML to a MIDI file. It extracts the timemap contained within the MIDI file, expressed as MIDI marker events.
 */
export declare class MmaConverter implements IMIDIConverter {
    protected _parameters?: Record<string, string> | undefined;
    protected _version?: {
        name: string;
        version: string;
    };
    protected _midi?: ArrayBuffer;
    protected _timemap?: MeasureTimemap;
    protected _uri: string;
    protected _xsltProcessor: IXSLTProcessor;
    constructor(uri: string, _parameters?: Record<string, string> | undefined, xsltProcessor?: IXSLTProcessor);
    initialize(musicXml: string, options: Required<PlayerOptions>): Promise<void>;
    get midi(): ArrayBuffer;
    get timemap(): MeasureTimemap;
    get version(): string;
}
//# sourceMappingURL=MmaConverter.d.ts.map