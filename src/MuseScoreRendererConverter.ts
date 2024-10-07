import { parseArrayBuffer as parseMidiBuffer } from 'midi-json-parser';
import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp } from './Player';
import { atoab, fetish } from './helpers';
import SaxonJS from './saxon-js/SaxonJS2.rt';

export type MuseScoreDownloader = (musicXml: string) => {
  pngs?: string[],
  svgs: string[],
  sposXML: string,
  mposXML: string,
  pdf?: string,
  midi: string,
  mxml?: string,
  metadata: {
    composer: string,
    duration: number,
    fileVersion: number,
    hasHarmonies: boolean,
    hasLyrics: boolean,
    keysig: number,
    lyrics?: string,
    measures: number,
    mscoreVersion: string,
    pageFormat: {
      height: number,
      twosided: boolean,
      width: number
    },
    pages: number,
    parts: {
      harmonyCount: number,
      hasDrumStaff: boolean,
      hasPitchedStaff: boolean,
      hasTabStaff: boolean,
      instrumentId: string,
      isVisible: boolean,
      lyricCount: number,
      name: string,
      program: number
    }[],
    poet: string,
    previousSource: string,
    subtitle: string,
    tempo: number,
    tempoText: string,
    textFramesData: {
      composers: string[],
      poets: string[],
      subtitles: string[],
      titles: string[],
    },
    timesig: string,
    title: string,
  },
  devinfo: {
    version: string,
  }
}

/**
 * Implementation of ISheetRenderer and IMidiConverter that uses MuseScore to generate the SVG, MIDI, and timemap files.
 *
 * Generate the score media with MuseScore as follows: `./mscore /path/to/score.musicxml --score-media > /path/to/score.json`
 */
export class MuseScoreRendererConverter implements ISheetRenderer, IMidiConverter {
  private _media?: ReturnType<MuseScoreDownloader>;
  private _midi?: IMidiFile;
  private _timemap?: MeasureTimemap;

  constructor(private _downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>) {}

  destroy(): void {}

  async initialize(
    container: HTMLElement,
    musicXml: string,
  ): Promise<void> {
    // We will be called twice because this is both a renderer and a converter.
    if (this._media) return;

    // Given a URL: Download the score media.
    if (typeof this._downloader === 'string') {
      this._media = await (await fetish(this._downloader)).json();
    }
    // Given media structure.
    else if ('pngs' in this._downloader) {
      this._media = this._downloader;
    }
    // Given a function to get the media.
    else {
      this._media = (<MuseScoreDownloader>this._downloader)(musicXml);
    }

    // Parse the MIDI.
    if (this._media) {
      this._midi = await parseMidiBuffer(atoab(this._media.midi));
    }

    // Parse and create the timemap.
    if (this._media) {
      this._timemap = [];
      const mpos = await SaxonJS.getResource({
        type: 'xml',
        encoding: 'utf8',
        text: window.atob(this._media.mposXML),
      });
      const measures: any[] = SaxonJS.XPath.evaluate('//events/event', mpos);
      measures.forEach((measure, i) => {
        const timestamp = parseInt(measure.getAttribute('position'))
        if (i > 0) {
          this._timemap![i - 1].duration = timestamp - this._timemap![i - 1].timestamp
        }
        this._timemap!.push({
          measure: i,
          timestamp,
          duration: 0
        })
      })

      // FIXME: Fake last measure duration by assuming it's equal to the previous one.
      if (this._timemap.length > 1) {
        this._timemap.last().duration = this._timemap[this._timemap.length - 2].duration;
      }
    }

    // Render the SVGs.
    this._media?.svgs.forEach(svg => {
      const page = document.createElement('div');
      page.innerHTML = window.atob(svg);
      page.getElementsByTagName('path')[0]?.setAttribute('fill', 'transparent');
      container.appendChild(page);
    });
  }

  moveTo(
    _index: MeasureIndex,
    _start: MillisecsTimestamp,
    _offset: MillisecsTimestamp,
    _duration?: MillisecsTimestamp,
  ): void {}

  resize(): void {}

  get midi(): IMidiFile {
    if (!this._midi) throw 'TODO';
    return this._midi;
  }

  get timemap(): MeasureTimemap {
    if (!this._timemap) throw 'TODO';
    return this._timemap;
  }

  get version(): string {
    return `MuseScore v${this._media?.devinfo.version ?? 'Unknown'}`
  }
}
