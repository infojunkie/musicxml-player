import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import { VerovioOptions } from 'verovio';

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

interface VerovioToolkitFixed extends VerovioToolkit {
  destroy(): void;
}

/**
 * Implementation of ISheetRenderer that uses Verovio @see https://github.com/rism-digital/verovio
 */
export class VerovioRenderer implements ISheetRenderer {
  private _vrv: VerovioToolkitFixed | null;
  private _player: Player | null;
  private _notes: Array<string>;
  private _timemap: Array<MillisecsTimestamp>;
  private _container: HTMLElement | null;
  private _options: VerovioOptions;

  constructor(options?: VerovioOptions) {
    this._vrv = null;
    this._player = null;
    this._notes = [];
    this._timemap = [];
    this._container = null;
    this._options = {
      ...{
        breaks: 'encoded',
        adjustPageHeight: true,
        scale: 50,
      },
      ...options,
    };
  }

  destroy() {
    if (this._vrv) {
      this._vrv.destroy();
      this._vrv = null;
    }
  }

  async initialize(
    player: Player,
    container: HTMLElement,
    musicXml: string,
  ): Promise<void> {
    this._player = player;
    this._container = container;

    const VerovioModule = await createVerovioModule();
    this._vrv = <VerovioToolkitFixed>new VerovioToolkit(VerovioModule);
    if (!this._vrv.loadData(musicXml)) throw 'TODO';

    // Setup timemap.
    this._vrv
      .renderToTimemap({ includeMeasures: true, includeRests: true })
      .forEach((e) => {
        const event = <TimeMapEntryFixed>e;
        if ('measureOn' in event) {
          this._timemap.push(event.tstamp);
        }
      });

    // First rendering.
    this._redraw();
    this.moveTo(0, 0);
  }

  moveTo(measureIndex: MeasureIndex, measureOffset: MillisecsTimestamp): void {
    const timestamp = Math.max(
      0,
      Math.min(
        measureIndex < this._timemap.length - 1
          ? this._timemap[measureIndex + 1]
          : this._timemap[measureIndex] + measureOffset,
        this._timemap[measureIndex] + measureOffset,
      ),
    );
    const elements = <ElementsAtTimeFixed>(
      this._vrv!.getElementsAtTime(timestamp)
    );
    const notes = [...(elements.notes || []), ...(elements.rests || [])];
    if (notes.length > 0 && this._notes != notes) {
      this._notes.forEach((noteid) => {
        if (!notes.includes(noteid)) {
          const note = document.getElementById(noteid);
          note?.setAttribute('fill', '#000');
          note?.setAttribute('stroke', '#000');
        }
      });
      this._notes = notes;
      this._notes.forEach((noteid) => {
        const note = document.getElementById(noteid);
        if (!note) return;
        note.setAttribute('fill', '#c00');
        note.setAttribute('stroke', '#c00');
        if (this._options.breaks === 'none') {
          note.scrollIntoView({ behavior: 'auto', inline: 'center' });
        } else {
          const system = note.closest('.system');
          system?.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      });
    }
  }

  resize(): void {
    if (this._container && this._vrv) {
      this._redraw();
    }
  }

  get version(): string {
    if (!this._vrv) throw 'TODO';
    return `verovio v${this._vrv.getVersion()}`;
  }

  private _redraw() {
    if (!this._container || !this._vrv) throw 'TODO';
    this._vrv.setOptions({
      ...this._options,
      ...{
        pageHeight:
          (this._container.clientHeight * 100) / (this._options.scale ?? 100),
        pageWidth:
          (this._container.clientWidth * 100) / (this._options.scale ?? 100),
      },
    });
    this._vrv.redoLayout({ resetCache: false });
    const pages = [];
    for (let page = 1; page <= this._vrv.getPageCount(); page++) {
      pages.push(this._vrv.renderToSVG(page));
    }
    const svg = pages.join('');
    this._container.innerHTML = svg;

    // Setup event listeners on notes.
    this._vrv
      .renderToTimemap({ includeMeasures: true, includeRests: true })
      .forEach((e) => {
        const event = <TimeMapEntryFixed>e;
        const measureIndex = this._timemap.length - 1;
        [...(event.on || []), ...(event.restsOn || [])].forEach((noteid) => {
          document.getElementById(noteid)?.addEventListener('click', () => {
            const measureOffset = event.tstamp - this._timemap[measureIndex];
            this.moveTo(measureIndex, measureOffset + 1);
            this._player?.moveTo(measureIndex, measureOffset);
          });
        });
      });
  }
}
