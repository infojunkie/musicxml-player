import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';

export interface TimeMapEntryFixed {
  tstamp: number;
  qstamp: number;
  on?: string[];
  off?: string[];
  restsOn?: string[];
  restsOff?: string[];
  tempo?: number;
  measureOn: string;
}

interface ElementsAtTimeFixed {
  notes: string[];
  rests: string[];
  chords: string[];
  page: number;
  measure: string;
}

/**
 * Implementation of ISheetRenderer that uses Verovio @see https://github.com/rism-digital/verovio
 */
export class VerovioRenderer implements ISheetRenderer {
  private vrv: VerovioToolkit | null;
  private player: Player | null;
  private notes: Array<string>;
  private timemap: Array<MillisecsTimestamp>;

  constructor() {
    this.vrv = null;
    this.player = null;
    this.notes = [];
    this.timemap = [];
  }

  async initialize(
    player: Player,
    container: HTMLDivElement | string,
    musicXml: string,
  ): Promise<void> {
    this.player = player;

    const VerovioModule = await createVerovioModule();
    this.vrv = new VerovioToolkit(VerovioModule);
    if (!this.vrv.loadData(musicXml)) {
      throw 'TODO';
    }

    this.vrv.setOptions({
      breaks: 'encoded',
      adjustPageHeight: true,
      scale: 50,
    });
    const pages = [];
    for (let page = 1; page <= this.vrv.getPageCount(); page++) {
      pages.push(this.vrv.renderToSVG(page));
    }
    const svg = pages.join('');
    if (typeof container === 'string') {
      document.getElementById(container)!.innerHTML = svg;
    } else if (container instanceof HTMLDivElement) {
      container.innerHTML = svg;
    }

    // Build measure timemap and setup event listeners on notes.
    this.vrv
      .renderToTimemap({ includeMeasures: true, includeRests: true })
      .forEach((e) => {
        const event = <TimeMapEntryFixed>e;
        if ('measureOn' in event) {
          this.timemap.push(event.tstamp);
        }
        const measureIndex = this.timemap.length - 1;
        [...(event.on || []), ...(event.restsOn || [])].forEach((noteid) => {
          document.getElementById(noteid)?.addEventListener('click', () => {
            const measureOffset = event.tstamp - this.timemap[measureIndex];
            this.moveTo(measureIndex, measureOffset + 1);
            this.player?.moveTo(measureIndex, measureOffset);
          });
        });
      });
    this.moveTo(0, 0);
  }

  moveTo(measureIndex: MeasureIndex, measureOffset: MillisecsTimestamp): void {
    const timestamp = Math.max(
      0,
      Math.min(
        measureIndex < this.timemap.length - 1
          ? this.timemap[measureIndex + 1]
          : this.timemap[measureIndex] + measureOffset,
        this.timemap[measureIndex] + measureOffset,
      ),
    );
    const elements = <ElementsAtTimeFixed>(
      this.vrv!.getElementsAtTime(timestamp)
    );
    const notes = [...(elements.notes || []), ...(elements.rests || [])];
    if (notes.length > 0 && this.notes != notes) {
      this.notes.forEach((noteid) => {
        if (!notes.includes(noteid)) {
          const note = document.getElementById(noteid);
          note?.setAttribute('fill', '#000');
          note?.setAttribute('stroke', '#000');
        }
      });
      this.notes = notes;
      this.notes.forEach((noteid) => {
        const note = document.getElementById(noteid);
        note?.setAttribute('fill', '#c00');
        note?.setAttribute('stroke', '#c00');
      });
    }
  }

  get version(): string {
    if (!this.vrv) throw 'TODO';
    return `verovio v${this.vrv.getVersion()}`;
  }
}
