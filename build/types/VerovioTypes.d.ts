import { VerovioOptions, TimeMapEntry } from 'verovio';
import { VerovioToolkit } from 'verovio/esm';
export interface TimeMapEntryFixed extends TimeMapEntry {
    restsOn?: string[];
    restsOff?: string[];
    measureOn?: string;
}
export interface ElementsAtTimeFixed {
    notes: string[];
    rests: string[];
    chords: string[];
    page: number;
    measure: string;
}
export interface VerovioToolkitFixed extends VerovioToolkit {
    /**
     * Destroy the Verovio Toolkit instance
     *
     * @returns void
     */
    destroy(): void;
}
export interface VerovioOptionsFixed extends VerovioOptions {
    /**
     * A custom tuning definition or filepath to apply to the MIDI output
     *
     * default: empty
     */
    tuningFile?: string;
    /**
     * Expand for all outputs, using selected, first, or generated expansion
     *
     * default: false
     */
    expandAlways?: boolean;
    /**
     * Expand for no output, including MIDI and timemap
     *
     * default: Expand for no output, including MIDI and timemap
     */
    expandNever?: boolean;
}
//# sourceMappingURL=VerovioTypes.d.ts.map