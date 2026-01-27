import { MeasureTimemap } from './interfaces/IMIDIConverter';
import { TimeMapEntryFixed } from './VerovioTypes';
import { assertIsDefined } from './helpers';

export class VerovioConverterBase {
  /**
   * Parse a Verovio timemap into our timemap.
   */
  protected static _parseTimemap(entries: TimeMapEntryFixed[]): MeasureTimemap {
    const timemap: MeasureTimemap = [];
    const rendmap: Record<string, number> = {};
    let tstamp = 0;
    entries.forEach((event) => {
      // If starting a measure, add it to the timemap.
      if ('measureOn' in event) {
        // Set the duration of previous measure.
        const i = timemap.length;
        if (i > 0) {
          timemap[i - 1].duration = event.tstamp - timemap[i - 1].timestamp;
        }

        // Detect measure repetition and build repetition map.
        const rend = event.measureOn.match(/([a-z0-9]+)(-rend(\d+))?/);
        assertIsDefined(rend);
        let mindex = Object.keys(rendmap).length;
        if (rend[2] !== undefined) {
          mindex = rendmap[rend[1]];
        } else {
          rendmap[rend[1]] = mindex;
        }

        // Add measure to the timemap.
        timemap.push({
          measure: mindex,
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
