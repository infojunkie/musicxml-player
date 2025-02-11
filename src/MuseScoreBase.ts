import { parseArrayBuffer as parseMidiBuffer } from 'midi-json-parser';
import type { IMidiFile } from 'midi-json-parser-worker';
import type { MeasureTimemap } from './IMidiConverter';
import { atoab, fetish } from './helpers';
import SaxonJS from './saxon-js/SaxonJS3.rt';

export type MuseScoreDownloader = (musicXml: string) => {
  pngs?: string[];
  svgs: string[];
  sposXML: string;
  mposXML: string;
  pdf?: string;
  midi: string;
  mxml?: string;
  metadata: {
    composer: string;
    duration: number;
    fileVersion: number;
    hasHarmonies: boolean;
    hasLyrics: boolean;
    keysig: number;
    lyrics?: string;
    measures: number;
    mscoreVersion: string;
    pageFormat: {
      height: number;
      twosided: boolean;
      width: number;
    };
    pages: number;
    parts: {
      harmonyCount: number;
      hasDrumStaff: boolean;
      hasPitchedStaff: boolean;
      hasTabStaff: boolean;
      instrumentId: string;
      isVisible: boolean;
      lyricCount: number;
      name: string;
      program: number;
    }[];
    poet: string;
    previousSource: string;
    subtitle: string;
    tempo: number;
    tempoText: string;
    textFramesData: {
      composers: string[];
      poets: string[];
      subtitles: string[];
      titles: string[];
    };
    timesig: string;
    title: string;
  };
  devinfo: {
    version: string;
  };
};

/**
 * Base class for MuseScore scores that parses the score metadata and creates a timemap.
 *
 * Generate the score media with MuseScore as follows: `./mscore /path/to/score.musicxml --score-media > /path/to/score.json`
 */
export class MuseScoreBase {
  protected _mscore?: ReturnType<MuseScoreDownloader>;
  protected _midi?: IMidiFile;
  protected _timemap?: MeasureTimemap;
  protected _mpos?: object;

  constructor(
    protected _downloader:
      | string
      | MuseScoreDownloader
      | ReturnType<MuseScoreDownloader>,
  ) {}

  async extract(musicXml: string): Promise<void> {
    // Retrieve MuseScore metadata.
    // ...given a URL: Download the score media.
    if (typeof this._downloader === 'string') {
      this._mscore = await (await fetish(this._downloader)).json();
    }
    // ...given a function to get the media.
    else if (typeof this._downloader === 'function') {
      this._mscore = (<MuseScoreDownloader>this._downloader)(musicXml);
    }
    // ...given media structure.
    else {
      this._mscore = this._downloader;
    }
    if (!this._mscore) {
      throw new Error(
        `[MuseScoreBase.initialize] Failed to retrieve MuseScore metadata.`,
      );
    }

    // Parse the MIDI.
    this._midi = await parseMidiBuffer(atoab(this._mscore.midi));

    // Parse and create the timemap.
    this._timemap = [];
    this._mpos = await SaxonJS.getResource({
      type: 'xml',
      encoding: 'utf8',
      text: window.atob(this._mscore.mposXML),
    });
    (<any[]>SaxonJS.XPath.evaluate('//events/event', this._mpos)).forEach(
      (measure, i) => {
        const timestamp = parseInt(measure.getAttribute('position'));
        if (i > 0) {
          this._timemap![i - 1].duration =
            timestamp - this._timemap![i - 1].timestamp;
        }
        this._timemap!.push({
          measure: i,
          timestamp,
          duration: 0,
        });
      },
    );

    // Compute last measure duration by getting total duration minus last measure onset.
    this._timemap.last().duration =
      this._mscore.metadata.duration * 1000 - this._timemap.last().timestamp;
  }
}
