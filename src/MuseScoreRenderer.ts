import type { ISheetRenderer } from './ISheetRenderer';
import { MuseScoreDownloader, MuseScoreBase } from './MuseScoreBase';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { assertIsDefined, binarySearch } from './helpers';
import SaxonJS from './saxon-js/SaxonJS2.rt';

// Constant to convert incoming coordinates in DPI into pixels.
// @see https://github.com/musescore/MuseScore/blob/v4.4.2/src/engraving/dom/mscore.h#DPI
// @see https://github.com/musescore/MuseScore/blob/v4.4.2/src/notation/internal/positionswriter.cpp#PositionsWriter::pngDpiResolution
// ASSUMPTION PNG resolution is not overridden.
const DOTS_PER_PIXEL = (72 * 5 * 12) / 96;

type MuseScorePosition = {
  x: number;
  y: number;
  sx: number;
  sy: number;
  page: number;
};

/**
 * Implementation of ISheetRenderer that uses MuseScore to generate the SVG score.
 *
 * Generate the score media with MuseScore as follows: `./mscore /path/to/score.musicxml --score-media > /path/to/score.json`
 */
export class MuseScoreRenderer extends MuseScoreBase implements ISheetRenderer {
  player?: Player;
  protected _cursor: HTMLDivElement;
  protected _measures?: MuseScorePosition[];
  protected _segments?: (MuseScorePosition & {
    timestamp: MillisecsTimestamp;
    duration: MillisecsTimestamp;
    measure: MeasureIndex;
  })[];

  constructor(
    downloader: string | MuseScoreDownloader | ReturnType<MuseScoreDownloader>,
  ) {
    super(downloader);
    this._cursor = document.createElement('div');
    this._cursor.className = 'player-cursor';
  }

  destroy(): void {
    this._cursor.remove();
  }

  async initialize(container: HTMLElement, musicXml: string): Promise<void> {
    // Extract the metadata in the base class.
    await this.extract(musicXml);
    assertIsDefined(this._mscore);

    // Store information we'll need later:
    // - Measures space positions
    // - Segments (musical events) space and time positions
    this._measures = (<any[]>(
      SaxonJS.XPath.evaluate('//elements/element', this._mpos)
    )).map((element) => {
      return {
        x: parseInt(element.getAttribute('x')) / DOTS_PER_PIXEL,
        y: parseInt(element.getAttribute('y')) / DOTS_PER_PIXEL,
        sx: parseInt(element.getAttribute('sx')) / DOTS_PER_PIXEL,
        sy: parseInt(element.getAttribute('sy')) / DOTS_PER_PIXEL,
        page: parseInt(element.getAttribute('page')),
      };
    });
    const spos = await SaxonJS.getResource({
      type: 'xml',
      encoding: 'utf8',
      text: window.atob(this._mscore.sposXML),
    });
    this._segments = (<any[]>(
      SaxonJS.XPath.evaluate('//elements/element', spos)
    )).map((element) => {
      return {
        x: parseInt(element.getAttribute('x')) / DOTS_PER_PIXEL,
        y: parseInt(element.getAttribute('y')) / DOTS_PER_PIXEL,
        sx: parseInt(element.getAttribute('sx')) / DOTS_PER_PIXEL,
        sy: parseInt(element.getAttribute('sy')) / DOTS_PER_PIXEL,
        page: parseInt(element.getAttribute('page')),
        timestamp: 0,
        duration: 0,
        measure: 0,
      };
    });
    (<any[]>SaxonJS.XPath.evaluate('//events/event', spos)).forEach(
      (segment, i) => {
        const timestamp = parseInt(segment.getAttribute('position'));
        if (i > 0) {
          this._segments![i - 1].duration =
            timestamp - this._segments![i - 1].timestamp;
        }
        this._segments![i].timestamp = timestamp;

        // Find the measure to which this segment belongs.
        const measure = binarySearch(
          this._timemap!,
          {
            measure: 0,
            timestamp,
            duration: 0,
          },
          (a, b) => {
            const d = a.timestamp - b.timestamp;
            if (Math.abs(d) < Number.EPSILON) return 0;
            return d;
          },
        );
        const mindex = measure >= 0 ? measure : Math.max(0, -measure - 2);
        this._segments![i].measure = mindex;
      },
    );
    this._segments.last().duration =
      this._mscore.metadata.duration * 1000 - this._segments.last().timestamp;

    // Render the SVGs.
    this._mscore.svgs.forEach((svg, i) => {
      const page = document.createElement('div');
      page.setAttribute('id', `page-${i}`);
      page.innerHTML = window.atob(svg);
      page.getElementsByTagName('path')[0]?.setAttribute('fill', 'transparent');
      page.addEventListener('click', (event) => {
        const segment = this._segments?.find((segment) => {
          return (
            segment.x <= event.offsetX &&
            segment.y <= event.offsetY &&
            segment.x + segment.sx > event.offsetX &&
            segment.y + segment.sy > event.offsetY
          );
        });
        if (segment && this.player) {
          this.player.moveTo(
            segment.measure,
            this._timemap![segment.measure].timestamp,
            segment.timestamp - this._timemap![segment.measure].timestamp,
          );
        }
      });
      container.appendChild(page);
    });

    // Initialize the cursor.
    container.appendChild(this._cursor);
    this.moveTo(0, 0, 0);
  }

  moveTo(
    index: MeasureIndex,
    start: MillisecsTimestamp,
    offset: MillisecsTimestamp,
    _duration?: MillisecsTimestamp,
  ): void {
    assertIsDefined(this._measures);
    assertIsDefined(this._segments);

    // Find the segment position based on time.
    const segment = binarySearch(
      this._segments,
      {
        x: 0,
        y: 0,
        sx: 0,
        sy: 0,
        page: 0,
        timestamp: start + offset,
        duration: 0,
        measure: 0,
      },
      (a, b) => {
        const d = a.timestamp - b.timestamp;
        if (Math.abs(d) < Number.EPSILON) return 0;
        return d;
      },
    );
    const sindex = segment >= 0 ? segment : Math.max(0, -segment - 2);

    // Move the cursor to this position.
    const x = this._segments[sindex].x;
    const y = this._segments[sindex].y;
    const height = this._measures[index].sy;
    this._cursor.style.transform = `translate(${x}px,${y}px)`;
    this._cursor.style.height = `${height}px`;
  }

  resize(): void {}

  get version(): string {
    return `MuseScore v${this._mscore?.devinfo.version ?? 'Unknown'}`;
  }
}
