import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import { VerovioOptions } from 'verovio';
import { MeasureTimemap } from './IMidiConverter';
import { assertIsDefined } from './helpers';

export interface TimemapEntryFixed {
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

/**
 * Implementation of ISheetRenderer that uses Verovio.
 * @see https://github.com/rism-digital/verovio
 */
export class VerovioRenderer implements ISheetRenderer {
  player?: Player;
  protected _vrv?: VerovioToolkitFixed;
  protected _container?: HTMLElement;
  protected _notes: string[] = [];
  protected _vrvOptions: VerovioOptions;
  protected _cursorOptions: CursorOptions;
  protected _timemap: MeasureTimemap = [];
  protected _measures: {
    rects: DOMRect[];
    elements: SVGGElement[];
  };
  protected _cursor: HTMLDivElement;
  protected _position: {
    x: number;
    y: number;
    height: number;
  };
  protected _scroll: {
    offset: number;
    left: number;
    top: number;
  };
  protected _measure: {
    index: MeasureIndex;
    start: MillisecsTimestamp;
    offset: MillisecsTimestamp;
    duration: MillisecsTimestamp | undefined;
  };

  constructor(vrvOptions?: VerovioOptions, cursorOptions?: CursorOptions) {
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
      index: 0,
      start: 0,
      offset: 0,
      duration: 0,
    };
    this._cursor = document.createElement('div');
    this._cursor.className = 'player-cursor';
  }

  destroy() {
    this._cursor.remove();
    this._vrv?.destroy();
  }

  async initialize(container: HTMLElement, musicXml: string): Promise<void> {
    this._container = container;

    // Create the Verovio toolkit.
    const VerovioModule = await createVerovioModule();
    this._vrv = <VerovioToolkitFixed>new VerovioToolkit(VerovioModule);
    if (!this._vrv.loadData(musicXml)) {
      throw new Error(`[VerovioRenderer.initialize] Failed to load MusicXML.`);
    }

    // Handle scrolling.
    this._container.addEventListener('scroll', () => {
      this._move();
    });

    // First rendering.
    this._redraw();
    this.moveTo(0, 0, 0);
  }

  moveTo(
    index: MeasureIndex,
    start: MillisecsTimestamp,
    offset: MillisecsTimestamp,
    duration?: MillisecsTimestamp,
  ) {
    assertIsDefined(this._vrv);

    // Cache the incoming measure params.
    this._measure = {
      index,
      start,
      offset,
      duration,
    };

    // Find the Verovio notes at the current timestamp.
    const timestamp = this._timemap[index].timestamp + offset;
    const elements = <ElementsAtTimeFixed>(
      this._vrv.getElementsAtTime(timestamp)
    );
    const notes = [...(elements.notes || []), ...(elements.rests || [])];
    if (!notes.length) {
      // Empty notes: Find the full-measure rest.
      const mRest = this._measures.elements[index].querySelector('g.mRest');
      if (mRest) notes.push(mRest.id);
    }

    // Highlight the notes, only if they changed.
    if (
      notes.length !== this._notes.length ||
      !this._notes.every((noteid, index) => notes[index] === noteid)
    ) {
      this._notes.forEach((noteid) => {
        if (!notes.includes(noteid)) {
          const note = document.getElementById(noteid);
          // TODO Restore original attributes.
          note?.setAttribute('fill', '#000');
          note?.setAttribute('stroke', '#000');
        }
      });
      this._notes = notes;
      this._notes.forEach((noteid) => {
        const note = document.getElementById(noteid);
        if (!note) return;

        // TODO Store original attributes and make highlight attributes configurable.
        note.setAttribute('fill', 'rgb(234, 107, 36)');
        note.setAttribute('stroke', 'rgb(234, 107, 36)');

        // Scroll to the highlighted notes.
        if (this._isHorizontalLayout()) {
          if (!duration) {
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
    if (this._isHorizontalLayout() && duration) {
      const scrollOffset = Math.round(
        this._measures.rects[index].left -
          this._cursorOptions.scrollOffset +
          Math.min(1.0, offset / duration) * this._measures.rects[index].width,
      );
      if (scrollOffset !== this._scroll.offset) {
        this._container?.scrollTo({ behavior: 'auto', left: scrollOffset });
        this._scroll.offset = scrollOffset;
      }
    }

    // Move the cursor.
    this._move();
  }

  resize(): void {
    this._redraw();

    // Force the notes highlighting and cursor position to be recalculated.
    this._notes = [];
    this.moveTo(
      this._measure.index,
      this._measure.start,
      this._measure.offset,
      this._measure.duration,
    );
  }

  get version(): string {
    return `verovio v${this._vrv?.getVersion() ?? `Unknown`}`;
  }

  protected _isHorizontalLayout(): boolean {
    return this._vrvOptions.breaks === 'none';
  }

  protected _move() {
    if (!this._notes.length) return;
    assertIsDefined(this._container);

    // FIXME Handle the case where the measure contains elements before the first note.
    const system =
      this._measures.elements[this._measure.index].closest('g.system');
    const systemRect = system!.getBoundingClientRect();
    const containerRect = this._container?.getBoundingClientRect();
    this._position = {
      x:
        -containerRect.left +
        (this._measure.duration
          ? Math.round(
              this._measures.rects[this._measure.index].left -
                this._container!.scrollLeft +
                Math.min(1.0, this._measure.offset / this._measure.duration) *
                  this._measures.rects[this._measure.index].width,
            )
          : document.getElementById(this._notes[0])!.getBoundingClientRect()
              .left),
      y: systemRect.top - containerRect.top,
      height: systemRect.height,
    };
    this._cursor.style.transform = `translate(${this._position.x}px,${this._position.y}px)`;
    this._cursor.style.height = `${this._position.height}px`;
  }

  protected _redraw() {
    assertIsDefined(this._container);
    assertIsDefined(this._vrv);

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
    this._container.textContent = '';
    this._container.appendChild(this._cursor);
    for (let i = 0; i < this._vrv.getPageCount(); i++) {
      const page = document.createElement('div');
      page.setAttribute('id', `page-${i}`);
      page.innerHTML = this._vrv.renderToSVG(i + 1);
      this._container.appendChild(page);
    }

    // Setup event listeners on notes.
    let firstNoteid: string | undefined;
    this._timemap = [];
    this._vrv
      .renderToTimemap({ includeMeasures: true, includeRests: true })
      .forEach((e) => {
        const event = <TimemapEntryFixed>e;
        if ('measureOn' in event) {
          this._timemap.push({
            measure: this._timemap.length,
            timestamp: event.tstamp,
            duration: 0, // Don't care about the duration for this renderer
          });
        }

        // For the closure below, we need the variables to be local.
        const localIndex = this._timemap.length - 1;
        const localStart = this._timemap[localIndex].timestamp;
        const localOffset = event.tstamp - localStart + 1;
        [...(event.on || []), ...(event.restsOn || [])].forEach((noteid) => {
          if (!firstNoteid) {
            firstNoteid = noteid;
          }
          document.getElementById(noteid)?.addEventListener('click', () => {
            this.player?.moveTo(localIndex, localStart, localOffset);
          });
        });
      });

    // Cache measures bounding rectangles for smooth scrolling.
    this._measures.elements = [];
    this._measures.rects = [];
    const measures =
      this._container!.querySelectorAll<SVGGElement>('svg g.measure');
    measures.forEach((measure, i) => {
      this._measures.elements.push(measure);
      const staff = measure.querySelector('g.staff');
      const rect = staff!.getBoundingClientRect();
      const note =
        measure.querySelector(`#${firstNoteid}`) ??
        measure.querySelector(`g.mRest`);
      if (i > 0 || !note) {
        this._measures.rects.push(
          DOMRect.fromRect({
            x: rect.x + this._container!.scrollLeft,
            y: rect.y + this._container!.scrollTop,
            height: rect.height,
            width: rect.width,
          }),
        );
      } else {
        // First measure: Start from first note instead of measure start.
        const noteRect = note.getBoundingClientRect();
        this._measures.rects.push(
          DOMRect.fromRect({
            x: noteRect.x + this._container!.scrollLeft,
            y: rect.y + this._container!.scrollTop,
            height: rect.height,
            width: rect.width - (noteRect.x - rect.x),
          }),
        );
      }
    });
  }
}
