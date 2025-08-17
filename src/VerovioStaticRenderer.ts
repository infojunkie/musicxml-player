import { ISheetRenderer } from "./ISheetRenderer";
import { TimeMapEntryFixed, VerovioBase } from "./VerovioBase";
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { assertIsDefined, fetish } from './helpers';
import pkg from '../package.json';

/**
 * Implementation of ISheetRenderer that uses statically-rendered Verovio assets:
 * - SVG files as obtained by `verovio --xml-id-checksum -t svg /path/to/score.musicxml`
 * - Timemap JSON file as obtained by `verovio --xml-id-checksum -t timemap --timemap-options '{ "includeMeasures": true, "includeRests": true }' /path/to/score.musicxml`
 */
export class VerovioStaticRenderer extends VerovioBase implements ISheetRenderer {
  player?: Player;
  protected _cursor: HTMLDivElement;
  protected _timemap?: TimeMapEntryFixed[];

  constructor(
    protected _svgOrUris: Array<ArrayBuffer | string>,
    protected _timemapOrUri: TimeMapEntryFixed[] | string,
  ) {
    super();
    this._cursor = document.createElement('div');
    this._cursor.className = 'player-cursor';
  }

  destroy(): void {
    this._cursor.remove();
  }

  async initialize(container: HTMLElement, _musicXml: string) {
    // Fetch the files.
    const enc = new TextDecoder('utf-8');
    const svgs = await Promise.all(this._svgOrUris.map(async (svgOrUri) =>
      typeof svgOrUri === 'string'
        ? await (await fetish(svgOrUri)).text()
        : enc.decode(svgOrUri)
    ));
    this._timemap =
      typeof this._timemapOrUri === 'string'
        ? await (await fetish(this._timemapOrUri)).json()
        : this._timemapOrUri;

    // Display the SVGs.
    svgs.forEach((svg, i) => {
      const page = document.createElement('div');
      page.setAttribute('id', `page-${i}`);
      page.innerHTML = svg;
      container.appendChild(page);
    });

    // Set up event listeners on notes.
    const measure = {
      index: -1,
      id: '',
      tstamp: 0,
    };
    assertIsDefined(this._timemap);
    this._timemap.forEach((event) => {
      if ('measureOn' in event) {
        measure.index++;
        measure.id = event.measureOn;
        measure.tstamp = event.tstamp;
      }
      [...(event.on ?? []), ...(event.restsOn ?? [])].forEach((noteid) => {
        document.getElementById(noteid)?.addEventListener('click', () => {
          this.player?.moveTo(measure.index, measure.tstamp, event.tstamp - measure.tstamp);
        });
      });
    });

    // Initialize the cursor.
    container.appendChild(this._cursor);
    this.moveTo(0, 0, 0);
  }

  moveTo(
    _index: MeasureIndex,
    _start: MillisecsTimestamp,
    _offset: MillisecsTimestamp,
    _duration?: MillisecsTimestamp,
  ): void {
    assertIsDefined(this._timemap);
  }

  resize(): void {}

  get version(): string {
    return `${pkg.name} v${pkg.version}`;
  }
}
