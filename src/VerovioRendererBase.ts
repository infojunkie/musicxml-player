import { MeasureTimemapEntry } from './IMIDIConverter';
import type { MeasureIndex, MillisecsTimestamp, Player, PlayerOptions } from './Player';
import { Cursor } from './Cursor';
import type { TimeMapEntryFixed } from './VerovioTypes';
import { assertIsDefined } from './helpers';

export class VerovioRendererBase {
  player?: Player;
  protected _options?: PlayerOptions;
  protected _container?: HTMLElement;
  protected _cursor: Cursor;
  protected _cursorOffset?: number;
  protected _svgs: string[] = [];
  protected _events?: (TimeMapEntryFixed & {
    measureEntry: number,
    rectNotes: DOMRect[],
    notesOn: string[],
  })[];
  protected _measures: (MeasureTimemapEntry & {
    eventEntry: number,
    measureId: string,
    systemId: string,
    rectMeasure: DOMRect,
    rectSystem: DOMRect,
  })[] = [];
  protected _currentNotes: {
    domid: string,
    fill: string | null,
    stroke: string | null,
  }[] = []; // Currently highlighted notes and their saved attributes
  protected _currentLocation: {
    index: MeasureIndex,
    start: MillisecsTimestamp,
    offset: MillisecsTimestamp,
    duration?: MillisecsTimestamp | undefined,
  } = { index: 0, start: 0, offset: 0 } // Current cursor location
  protected _currentEventEntry: number = Infinity; // Currently highlighted event entry
  protected _currentScrollOffset?: number;

  constructor() {
    this._cursor = new Cursor();
  }

  protected _recalculate(
    container: HTMLElement,
    timemap: TimeMapEntryFixed[],
    svgs: string[],
    options: PlayerOptions
  ) {
    // Initialize the Verovio state.
    this._container = container;
    this._options = options;
    this._events = timemap.map((e: TimeMapEntryFixed) => { return {...e, measureEntry: 0, rectNotes: [], notesOn: []}; });
    this._measures = [];
    this._currentNotes = [];

    // Display the SVGs.
    this._svgs = svgs;
    this._svgs.forEach((svg, i) => {
      const page = document.createElement('div');
      page.setAttribute('id', `page-${i}`);
      page.classList.add('sheet-page');
      page.innerHTML = svg;
      container.appendChild(page);

      // Scale the SVG to the container width.
      assertIsDefined(this._options);
      if (!options.horizontal) {
        const s = page.getElementsByTagName('svg')[0];
        const w = s.getAttribute('width')?.replace('px', '');
        const h = s.getAttribute('height')?.replace('px', '');
        s.setAttribute('viewBox', `0 0 ${w} ${h}`);
        s.setAttribute('width', '100%');
        s.removeAttribute('height');
      }
    });

    // Set up event listeners on notes and cached information for cursor movement.
    assertIsDefined(this._events);
    this._events.forEach((event, eventEntry) => {
      // On new measure, save the measure information.
      if ('measureOn' in event) {
        const measure = document.getElementById(event.measureOn)!;
        const system = measure.closest('g.system')!;
        this._measures.push({
          measure: this._measures.length,
          timestamp: event.tstamp,
          duration: 0, // Don't care about the duration for this renderer
          eventEntry,
          measureId: measure.id,
          systemId: system.id,
          rectMeasure: measure.getBoundingClientRect(),
          rectSystem: system.getBoundingClientRect(),
        });
      }

      // Carry over the previously sounding notes and remove the ending notes.
      assertIsDefined(this._events);
      event.measureEntry = this._measures.length-1;
      event.notesOn = eventEntry > 0 ? structuredClone(this._events[eventEntry-1].notesOn) : [];
      const notesOff = [...(event.off ?? []), ...(event.restsOff ?? [])];
      event.notesOn = event.notesOn.filter(n => !notesOff.includes(n));

      // Set up an event listener for each new note/rest.
      // Add each new note to the list of sounding notes.
      const measure = this._measures.last();
      [...(event.on ?? []), ...(event.restsOn ?? [])].forEach((domid) => {
        const note = document.getElementById(domid)!;
        note.addEventListener('click', () => {
          this.player?.moveTo(measure.measure, measure.timestamp, event.tstamp - measure.timestamp);
        });
        event.notesOn.push(domid);
      });
    });

    // Now recompute the dimensions.
    this._refresh();
  }

  protected _refresh() {
    assertIsDefined(this._events);
    this._events.forEach((event, eventEntry) => {
      event.rectNotes = [];

      // On new measure, recalculate measure dimensions.
      if ('measureOn' in event) {
        const measure = document.getElementById(event.measureOn)!;
        const system = measure.closest('g.system')!;
        this._measures[event.measureEntry].rectMeasure = measure.getBoundingClientRect();
        this._measures[event.measureEntry].rectSystem = system.getBoundingClientRect();
      }

      // Recaculate note dimensions.
      const measure = this._measures.last();
      [...(event.on ?? []), ...(event.restsOn ?? [])].forEach((domid) => {
        const note = document.getElementById(domid)!;
        event.rectNotes.push(note.getBoundingClientRect());
      });

      // Ensure at least one rectNote exists.
      if (!event.rectNotes.length) {
        event.rectNotes.push(measure.rectMeasure);
      }

      // Special case: If this is the first note, set the measure's bounding rect to start here
      // in order to avoid objects such as time signature and key signature.
      if (eventEntry === 0) {
        measure.rectMeasure.width -= event.rectNotes[0].left - measure.rectMeasure.left;
        measure.rectMeasure.x = event.rectNotes[0].x;
        this._cursorOffset = event.rectNotes[0].left;
      }
    });

    assertIsDefined(this._container);
    this._currentScrollOffset = this._container.scrollLeft;
  }

  protected _move(
    index: MeasureIndex,
    start: MillisecsTimestamp,
    offset: MillisecsTimestamp,
    duration?: MillisecsTimestamp
  ) {
    assertIsDefined(this._events);
    assertIsDefined(this._container);
    assertIsDefined(this._options);

    // Remember this location.
    this._currentLocation = {
      index,
      start,
      offset,
      duration
    }

    // Find event entry that corresponds to current position.
    // Start searching at the incoming measure and find the subsequent event entry with matching timestamp.
    const timestamp = this._measures[index].timestamp + offset;
    let eventEntry = this._measures[index].eventEntry;
    while (eventEntry < this._events.length - 1 && this._events[eventEntry + 1].tstamp <= timestamp) {
      eventEntry++;
    }

    // Restore the deactivated notes to their previous attributes.
    // Highlight the activated notes and save their attributes.
    if (this._currentEventEntry !== eventEntry || !this._currentNotes.length) {
      const notesOn = this._events[eventEntry].notesOn;
      const notesOff = this._currentNotes.filter((note) => !notesOn.includes(note.domid));
      notesOff.forEach((note) => {
        const element = document.getElementById(note.domid);
        if (note.fill) element?.setAttribute('fill', note.fill); else element?.removeAttribute('fill');
        if (note.stroke) element?.setAttribute('stroke', note.stroke); else element?.removeAttribute('stroke');
      });
      this._currentNotes = this._currentNotes.filter((note) => notesOn.includes(note.domid));
      notesOn.forEach(domid => {
        const element = document.getElementById(domid);
        if (!this._currentNotes.find((note) => note.domid === domid)) {
          this._currentNotes.push({ domid, fill: element?.getAttribute('fill') ?? null, stroke: element?.getAttribute('stroke') ?? null });
        }
        element?.setAttribute('fill', 'rgb(234, 107, 36)');
        element?.setAttribute('stroke', 'rgb(234, 107, 36)');
      });
      this._currentEventEntry = eventEntry;

      // Focus the score around the cursor.
      if (this._options.followCursor) {
        if (this._options.horizontal) {
          if (!duration) {
            const element = document.getElementById(notesOn.length ? notesOn[0] : this._measures[index].measureId);
            element?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }
        else {
          const system = document.getElementById(this._measures[index].systemId);
          system?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }

    // Scroll smoothly if using horizontal mode.
    const rectMeasure = this._measures[index].rectMeasure;
    const rectSystem = this._measures[index].rectSystem;
    const rectNote = this._events[eventEntry].rectNotes[0]; // guaranteed to have at least one
    if (this._options.horizontal && duration) {
      assertIsDefined(this._cursorOffset);
      this._container.scrollTo({
        behavior: 'auto',
        left: Math.floor(rectMeasure.left - this._cursorOffset + Math.min(1.0, offset / duration) * rectMeasure.width)
      });
    }

    // Calculate cursor position.
    assertIsDefined(this._currentScrollOffset);
    this._cursor.moveTo(
      this._currentScrollOffset + (duration
        ? rectMeasure.left + Math.round(Math.min(1.0, offset / duration) * rectMeasure.width)
        : rectNote.left),
      rectSystem.top,
      rectSystem.height
    );
  }
}
