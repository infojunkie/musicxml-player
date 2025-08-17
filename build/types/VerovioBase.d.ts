import { VerovioOptions } from 'verovio';
import { VerovioToolkit } from 'verovio/esm';
import type { MeasureTimemap } from './IMidiConverter';
export interface TimeMapEntryFixed {
    measureOn?: string;
    tstamp: number;
    qstamp: number;
    on?: string[];
    off?: string[];
    restsOn?: string[];
    restsOff?: string[];
    tempo?: number;
}
export interface CursorOptions {
    scrollOffset: number;
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
/**
 * Base class for Verovio.
 */
export declare class VerovioBase {
    /**
     * Parse a Verovio timemap into our timemap.
     */
    protected static _parseTimemap(entries: TimeMapEntryFixed[]): MeasureTimemap;
}
//# sourceMappingURL=VerovioBase.d.ts.map