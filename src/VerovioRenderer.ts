import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';

interface TimeMapEntryFixed {
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

export class VerovioRenderer implements ISheetRenderer {
  private vrv: VerovioToolkit | null;
  private player: Player | null;
  private notes: Array<string>;
  private timestamps: Array<MillisecsTimestamp>;

  constructor() {
    this.vrv = null;
    this.player = null;
    this.notes = [];
    this.timestamps = [];
  }

  version(): string {
    if (!this.vrv) throw 'TODO';
    return `verovio v${this.vrv.getVersion()}`;
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
          this.timestamps.push(event.tstamp);
        }
        const measureIndex = this.timestamps.length - 1;
        [...(event.on || []), ...(event.restsOn || [])].forEach((noteid) => {
          document.getElementById(noteid)?.addEventListener('click', () => {
            const measureMillisecs =
              event.tstamp - this.timestamps[measureIndex];
            this.seek(measureIndex, measureMillisecs + 1);
            this.player!.move(measureIndex, measureMillisecs);
          });
        });
      });
    this.seek(0, 0);
  }

  seek(measureIndex: MeasureIndex, measureMillisecs: MillisecsTimestamp): void {
    const timestamp = Math.max(
      0,
      Math.min(
        measureIndex < this.timestamps.length - 1
          ? this.timestamps[measureIndex + 1]
          : this.timestamps[measureIndex] + measureMillisecs,
        this.timestamps[measureIndex] + measureMillisecs,
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
}
