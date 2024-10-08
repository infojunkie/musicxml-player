import type { IMidiFile } from 'midi-json-parser-worker';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';

export type MeasureTimemapEntry = {
  measure: MeasureIndex;
  timestamp: MillisecsTimestamp;
  duration: MillisecsTimestamp;
};
export type MeasureTimemap = MeasureTimemapEntry[];

/**
 * Interface to a MusicXML-to-MIDI converter.
 *
 * The converter is given a MusicXML file and is expected to produce 2 artefacts from it:
 * - A standard MIDI file expressed as an IMidiFile JSON structure,
 *   typically obtained by parsing a raw ArrayBuffer using midi-json-parser
 * - A "timemap" which is an array of MeasureTimemapEntry structures associating
 *   the index of each measure in the MusicXML file (0-based) to a millisecond offset starting at 0ms.
 *   Repeats and jumps should be explicitly "unrolled" in this timemap
 *   in order for the sheet display to properly sync with the MIDI playback.
 *
 * Refer to the various implementations of this interface for details.
 */
export interface IMidiConverter {
  player?: Player;
  initialize(
    container: HTMLElement,
    musicXml: string,
  ): Promise<void>;
  get midi(): IMidiFile;
  get timemap(): MeasureTimemap;
  get version(): string;
}
