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

export interface CursorOptions {
  scrollOffset: number;
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

type CursorPosition = {
  x: number;
  y: number;
  height: number;
};

/**
 * Implementation of ISheetRenderer that uses Verovio @see https://github.com/rism-digital/verovio
 */
export class VerovioRenderer implements ISheetRenderer {
  private _vrv: VerovioToolkitFixed | null;
  private _player: Player | null;
  private _notes: Array<string>;
  private _container: HTMLElement | null;
  private _vrvOptions: VerovioOptions;
  private _cursorOptions: CursorOptions;
  private _timemap: MeasureTimemap;
  private _measures: {
    rects: DOMRect[];
    elements: SVGGElement[];
  };
  private _cursor: HTMLDivElement;
  private _position: CursorPosition;
  private _scroll: {
    offset: number;
    left: number;
    top: number;
  };
  private _measure: {
    measureIndex: MeasureIndex;
    measureStart: MillisecsTimestamp;
    measureOffset: MillisecsTimestamp;
    measureDuration: MillisecsTimestamp | undefined;
  };

  constructor(vrvOptions?: VerovioOptions, cursorOptions?: CursorOptions) {
    this._vrv = null;
    this._player = null;
    this._notes = [];
    this._container = null;
    this._vrvOptions = {
      ...{
        breaks: 'encoded',
        adjustPageHeight: true,
        scale: 50,
        footer: 'none',
      },
      ...vrvOptions,
    };
    this._cursorOptions = {
      ...{
        scrollOffset: 50,
      },
      ...cursorOptions,
    };
    this._timemap = [];
    this._measures = {
      rects: [],
      elements: [],
    };
    this._scroll = {
      offset: 0,
      left: 0,
      top: 0,
    };
    this._position = {
      x: 0,
      y: 0,
      height: 0,
    };
    this._measure = {
      measureIndex: 0,
      measureStart: 0,
      measureOffset: 0,
      measureDuration: 0,
    };
    this._cursor = document.createElement('div');
    this._cursor.className = 'player-cursor';
  }

  destroy() {
    this._cursor?.remove();
    this._vrv?.destroy();
  }

  async initialize(
    player: Player,
    container: HTMLElement,
    musicXml: string,
  ): Promise<void> {
    this._player = player;
    this._container = container;

    // Create the Verovio toolkit.
    const VerovioModule = await createVerovioModule();
    this._vrv = <VerovioToolkitFixed>new VerovioToolkit(VerovioModule);
    if (!this._vrv.loadData(musicXml)) throw 'TODO';

    // Initialize the cursor.
    // FIXME Create the sheet div inside the sheet container instead of using the container parent.
    this._container.parentElement!.appendChild(this._cursor);
    this._container.addEventListener('scroll', () => {
      this._moveCursor();
    });

    // First rendering.
    this._drawSheet();
    this.moveTo(0, 0, 0);
  }

  moveTo(
    measureIndex: MeasureIndex,
    measureStart: MillisecsTimestamp,
    measureOffset: MillisecsTimestamp,
    measureDuration?: MillisecsTimestamp,
  ) {
    // Cache the incoming measure params.
    this._measure = {
      measureIndex,
      measureStart,
      measureOffset,
      measureDuration,
    };

    // Find the Verovio notes at the current timestamp.
    const timestamp = this._timemap[measureIndex].timestamp + measureOffset;
    const elements = <ElementsAtTimeFixed>(
      this._vrv!.getElementsAtTime(timestamp)
    );
    const notes = [...(elements.notes || []), ...(elements.rests || [])];

    // Highlight the notes.
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
          const system = note.closest('g.system');
          system?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    // Scroll smoothly if using horizontal mode.
    if (this._isHorizontalLayout() && measureDuration) {
      const scrollOffset = Math.round(
        this._measures.rects[measureIndex].left -
          this._cursorOptions.scrollOffset +
          Math.min(1.0, measureOffset / measureDuration) *
            this._measures.rects[measureIndex].width,
      );
      if (scrollOffset !== this._scroll.offset) {
        this._container?.scrollTo({ behavior: 'auto', left: scrollOffset });
        this._scroll.offset = scrollOffset;
      }
    }

    // Move the cursor.
    this._moveCursor();
  }

  resize(): void {
    if (this._container && this._vrv) {
      this._drawSheet();
      this._moveCursor();
    }
  }

  get version(): string {
    if (!this._vrv) throw 'TODO';
    return `verovio v${this._vrv.getVersion()}`;
  }

  private _isHorizontalLayout(): boolean {
    return this._vrvOptions.breaks === 'none';
  }

  private _moveCursor() {
    if (!this._notes.length) return;

    // FIXME Handle the case where the measure contains elements before the first note.
    let x = 0;
    if (this._measure.measureDuration) {
      x = Math.round(
        window.scrollX +
          this._measures.rects[this._measure.measureIndex].left -
          this._container!.scrollLeft +
          Math.min(
            1.0,
            this._measure.measureOffset / this._measure.measureDuration,
          ) *
            this._measures.rects[this._measure.measureIndex].width,
      );
    } else {
      const note = document.getElementById(this._notes[0]);
      x = note!.getBoundingClientRect().left;
    }
    const system =
      this._measures.elements[this._measure.measureIndex].closest('g.system');
    const systemRect = system!.getBoundingClientRect();
    this._position = {
      x,
      y: systemRect.top + window.scrollY,
      height: systemRect.height,
    };
    this._cursor.style.transform = `translate(${this._position.x}px,${this._position.y}px)`;
    this._cursor.style.height = `${this._position.height}px`;
  }

  private _drawSheet() {
    if (!this._container || !this._vrv) throw 'TODO';

    this._vrv.setOptions({
      ...this._vrvOptions,
      ...{
        pageHeight:
          (this._container.parentElement!.clientHeight * 100) /
          (this._vrvOptions.scale ?? 100),
        pageWidth:
          (this._container.parentElement!.clientWidth * 100) /
          (this._vrvOptions.scale ?? 100),
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
        const localOffset = event.tstamp - localStart + 1;
        [...(event.on || []), ...(event.restsOn || [])].forEach((noteid) => {
          document.getElementById(noteid)?.addEventListener('click', () => {
            this._player?.moveTo(localIndex, localStart, localOffset);
          });
        });
      });

    // Cache measures bounding rectangles for smooth scrolling.
    this._measures.elements = [];
    this._measures.rects = [];
    const measures =
      this._container?.querySelectorAll<SVGGElement>('svg g.measure');
    measures.forEach((measure) => {
      this._measures.elements.push(measure);
      const staff = measure.querySelector('g.staff');
      const rect = staff!.getBoundingClientRect();
      this._measures.rects.push(
        DOMRect.fromRect({
          x: rect.x + window.scrollX + this._container!.scrollLeft,
          y: rect.y + window.scrollY + this._container!.scrollTop,
          height: rect.height,
          width: rect.width,
        }),
      );
    });
  }
}
