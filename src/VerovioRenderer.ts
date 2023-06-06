import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import { VerovioOptions } from 'verovio';
import { MeasureTimemap } from './IMidiConverter';

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
  private _container: HTMLElement | null;
  private _options: VerovioOptions;
  private _timemap: MeasureTimemap;
  private _cacheScroll: {
    rects: DOMRect[];
    offset: number;
  };

  constructor(options?: VerovioOptions) {
    this._vrv = null;
    this._player = null;
    this._notes = [];
    this._container = null;
    this._options = {
      ...{
        breaks: 'encoded',
        adjustPageHeight: true,
        scale: 50,
      },
      ...options,
    };
    this._timemap = [];
    this._cacheScroll = {
      rects: [],
      offset: 0,
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

    // First rendering.
    this._redraw();
    this.moveTo(0, 0, 0);
  }

  moveTo(
    measureIndex: MeasureIndex,
    _: MillisecsTimestamp,
    measureOffset: MillisecsTimestamp,
    measureDuration?: MillisecsTimestamp,
  ): void {
    const timestamp = this._timemap[measureIndex].timestamp + measureOffset;
    const elements = <ElementsAtTimeFixed>(
      this._vrv!.getElementsAtTime(timestamp)
    );
    const notes = [...(elements.notes || []), ...(elements.rests || [])];

    // Refresh the cursor.
    if (
      notes.length !== this._notes.length ||
      !this._notes.every((noteid, index) => notes[index] === noteid)
    ) {
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

        // Scroll to the highlighted notes.
        if (this._isHorizontalLayout()) {
          if (!measureDuration) {
            note.scrollIntoView({
              behavior: 'smooth',
              inline: 'center',
              block: 'nearest',
            });
          }
        } else {
          const system = note.closest('.system');
          system?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    // Scroll smoothly if using horizontal mode.
    if (this._isHorizontalLayout() && measureDuration) {
      const offset = Math.round(
        this._cacheScroll.rects[measureIndex].left -
          this._cacheScroll.rects[0].left +
          Math.min(1.0, measureOffset / measureDuration) *
            this._cacheScroll.rects[measureIndex].width,
      );
      if (offset !== this._cacheScroll.offset) {
        this._container?.scrollTo({ behavior: 'auto', left: offset });
        this._cacheScroll.offset = offset;
      }
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

  private _isHorizontalLayout(): boolean {
    return this._options.breaks === 'none';
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
    this._timemap = [];
    this._vrv
      .renderToTimemap({ includeMeasures: true, includeRests: true })
      .forEach((e) => {
        const event = <TimeMapEntryFixed>e;
        if ('measureOn' in event) {
          this._timemap.push({
            measure: this._timemap.length,
            timestamp: event.tstamp,
          });
        }

        // For the closure below, we need the variables to be local.
        const localIndex = this._timemap.length - 1;
        const localStart = this._timemap[localIndex].timestamp;
        const localOffset = event.tstamp - localStart;
        [...(event.on || []), ...(event.restsOn || [])].forEach((noteid) => {
          document.getElementById(noteid)?.addEventListener('click', () => {
            this.moveTo(localIndex, localStart, localOffset + 1);
            this._player?.moveTo(localIndex, localOffset);
          });
        });
      });

    // Cache measures bounding rectangles for smooth scrolling.
    if (this._isHorizontalLayout()) {
      const measures = this._container?.querySelectorAll('svg .measure');
      measures.forEach((measure) => {
        this._cacheScroll.rects.push(measure.getBoundingClientRect());
      });
    }
  }
}
