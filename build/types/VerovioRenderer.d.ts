import type { ISheetRenderer } from './ISheetRenderer';
import { type MeasureIndex, type MillisecsTimestamp, type PlayerOptions } from './Player';
import { VerovioRendererBase } from './VerovioRendererBase';
import { VerovioOptionsFixed, VerovioToolkitFixed } from './VerovioTypes';
/**
 * Implementation of ISheetRenderer that uses Verovio to convert a MusicXML file to SVGs and timemap.
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertosvg
 * @see https://book.verovio.org/toolkit-reference/toolkit-methods.html#rendertotimemap
 */
export declare class VerovioRenderer extends VerovioRendererBase implements ISheetRenderer {
    protected _vrv?: VerovioToolkitFixed;
    protected _vrvOptions: VerovioOptionsFixed;
    constructor(vrvOptions?: VerovioOptionsFixed);
    destroy(): void;
    initialize(container: HTMLElement, musicXml: string, options: Required<PlayerOptions>): Promise<void>;
    moveTo(index: MeasureIndex, start: MillisecsTimestamp, offset: MillisecsTimestamp, duration?: MillisecsTimestamp): void;
    onResize(): void;
    onEvent(type: string): void;
    get version(): string;
    protected _redraw(container: HTMLElement, options: PlayerOptions): void;
}
//# sourceMappingURL=VerovioRenderer.d.ts.map