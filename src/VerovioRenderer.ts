import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import type { ISheetRenderer } from './ISheetRenderer';
import { PlayerState, type MeasureIndex, type MillisecsTimestamp, type PlayerOptions } from './Player';
import { VerovioRendererBase } from './VerovioRendererBase';
import { VerovioOptionsFixed, VerovioToolkitFixed } from './VerovioTypes';
import { assertIsDefined } from './helpers';

/**
 * Implementation of ISheetRenderer that uses Verovio to convert a MusicXML file to SVGs and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertosvg
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 */
export class VerovioRenderer extends VerovioRendererBase implements ISheetRenderer {
  protected _vrv?: VerovioToolkitFixed;
  protected _vrvOptions: VerovioOptionsFixed = {};

  constructor(vrvOptions?: VerovioOptionsFixed) {
    super();
    this._vrvOptions = { ...vrvOptions };
  }

  destroy() {
    this._cursor.destroy();
    this._vrv?.destroy();
  }

  async initialize(container: HTMLElement, musicXml: string, options: Required<PlayerOptions>): Promise<void> {
    // Adjust options based on PlayerOptions.
    this._vrvOptions = {
      ...{
        adjustPageHeight: true,
        scale: 50,
        footer: 'none',
        font: 'Bravura',
        breaks: options.horizontal ? 'none' : 'smart',
        spacingNonLinear: options.horizontal ? 1.0 : 0.6,
        spacingLinear: options.horizontal ? 0.04 : 0.25,
      },
      ...this._vrvOptions
    }

    // Create the Verovio toolkit.
    const VerovioModule = await createVerovioModule();
    this._vrv = <VerovioToolkitFixed>new VerovioToolkit(VerovioModule);
    if (!this._vrv.loadData(musicXml)) {
      throw new Error(`[VerovioRenderer.initialize] Failed to load MusicXML.`);
    }

    // Render the score and compute the internal data structures.
    this._redraw(container, options);

    // Initialize the cursor.
    this._cursor.initialize(container);
  }

  moveTo(
    index: MeasureIndex,
    start: MillisecsTimestamp,
    offset: MillisecsTimestamp,
    duration?: MillisecsTimestamp,
  ) {
    this._move(index, start, offset, duration);
  }

  onResize(): void {
    assertIsDefined(this._container);
    assertIsDefined(this._options);
    this._redraw(this._container, this._options);
    this._move(
      this._currentLocation.index,
      this._currentLocation.start,
      this._currentLocation.offset,
      this._currentLocation.duration
    );
  }

  onEvent(type: string): void {
    this._refresh();
    this._move(
      this._currentLocation.index,
      this._currentLocation.start,
      this._currentLocation.offset,
      this._currentLocation.duration
    );
  }

  get version(): string {
    return `verovio v${this._vrv?.getVersion() ?? `Unknown`}`;
  }

  protected _redraw(container: HTMLElement, options: PlayerOptions) {
    assertIsDefined(this._vrv);

    // Render the score.
    const svgs: string[] = [];
    this._vrv.setOptions({
      ...this._vrvOptions,
      ...{
        pageHeight:
          (container.parentElement!.clientHeight * 100) /
          (this._vrvOptions.scale ?? 100),
        pageWidth:
          (container.parentElement!.clientWidth * 100) /
          (this._vrvOptions.scale ?? 100),
      },
    });
    this._vrv.redoLayout({ resetCache: false });
    for (let i = 0; i < this._vrv.getPageCount(); i++) {
      svgs.push(this._vrv.renderToSVG(i + 1));
    }
    const timemap = this._vrv.renderToTimemap({ includeMeasures: true, includeRests: true });

    // Delete existing pages and calculate from scratch.
    container.querySelectorAll('.sheet-page').forEach(e => e.remove());
    this._recalculate(container, timemap, svgs, options);
  }
}
