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
export class VerovioBase {
  /**
   * Parse a Verovio timemap into our timemap.
   */
  protected static _parseTimemap(
    entries: TimeMapEntryFixed[],
  ): MeasureTimemap {
    const timemap: MeasureTimemap = [];
    let tstamp = 0;
    entries.forEach((event) => {
      // If starting a measure, add it to the timemap.
      if ('measureOn' in event) {
        const i = timemap.length;
        if (i > 0) {
          timemap[i - 1].duration =
            event.tstamp - timemap[i - 1].timestamp;
        }
        timemap.push({
          measure: i,
          timestamp: event.tstamp,
          duration: 0,
        });
      }

      // Find the duration of the last measure.
      // Calculate the max tstamp and compute the last measure duration based on that.
      tstamp = Math.max(tstamp, event.tstamp);
    });
    timemap.last().duration = tstamp - timemap.last().timestamp;
    return timemap;
  }
}
