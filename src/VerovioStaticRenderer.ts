import { ISheetRenderer } from './ISheetRenderer';
import { TimeMapEntryFixed } from './VerovioTypes';
import { VerovioRendererBase } from './VerovioRendererBase';
import { PlayerState, type MeasureIndex, type MillisecsTimestamp, type PlayerOptions } from './Player';
import { fetish } from './helpers';
import pkg from '../package.json';

/**
 * Implementation of ISheetRenderer that uses statically-rendered Verovio assets:
 * - SVG files as obtained by `verovio --xml-id-checksum -t svg /path/to/score.musicxml`
 * - Timemap JSON file as obtained by `verovio --xml-id-checksum -t timemap --timemap-options '{ "includeMeasures": true, "includeRests": true }' /path/to/score.musicxml`
 */
export class VerovioStaticRenderer extends VerovioRendererBase implements ISheetRenderer {
  constructor(
    protected _svgOrUris: Array<ArrayBuffer | string>,
    protected _eventsOrUri: TimeMapEntryFixed[] | string,
  ) {
    super();
  }

  destroy(): void {
    this._cursor.destroy();
  }

  async initialize(container: HTMLElement, _musicXml: string, options: PlayerOptions) {
    // Fetch the files.
    const enc = new TextDecoder('utf-8');
    const svgs = await Promise.all(this._svgOrUris.map(async (svgOrUri) =>
      typeof svgOrUri === 'string'
        ? await (await fetish(svgOrUri)).text()
        : enc.decode(svgOrUri)
    ));
    const timemap =
      typeof this._eventsOrUri === 'string'
        ? await (await fetish(this._eventsOrUri)).json()
        : this._eventsOrUri;

    // Compute the internal data structures.
    this._recalculate(container, timemap, svgs, options);

    // Initialize the cursor.
    this._cursor.initialize(container);
    this.moveTo(0, 0, 0);
  }

  moveTo(
    index: MeasureIndex,
    start: MillisecsTimestamp,
    offset: MillisecsTimestamp,
    duration?: MillisecsTimestamp,
  ): void {
    this._move(index, start, offset, duration);
  }

  onResize(): void {
    this._refresh();
    this.moveTo(
      this._currentLocation.index,
      this._currentLocation.start,
      this._currentLocation.offset,
      this._currentLocation.duration
    );
  }

  onEvent(): void {
    this._refresh();
    this.moveTo(
      this._currentLocation.index,
      this._currentLocation.start,
      this._currentLocation.offset,
      this._currentLocation.duration
    );
  }

  get version(): string {
    return `${pkg.name}/VerovioStaticRenderer v${pkg.version}`;
  }
}
