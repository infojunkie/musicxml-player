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
    destroy(): void;
}
export interface VerovioOptionsFixed extends VerovioOptions {
    tuning?: string;
}
//# sourceMappingURL=VerovioTypes.d.ts.map