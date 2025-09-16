import { MeasureTimemapEntry } from './IMIDIConverter';
import type { MeasureIndex, MillisecsTimestamp, Player, PlayerOptions } from './Player';
import { Cursor } from './Cursor';
import type { TimeMapEntryFixed } from './VerovioTypes';
export declare class VerovioRendererBase {
    player?: Player;
    protected _options?: PlayerOptions;
    protected _container?: HTMLElement;
    protected _cursor: Cursor;
    protected _cursorOffset?: number;
    protected _svgs: string[];
    protected _events?: (TimeMapEntryFixed & {
        measureEntry: number;
        rectNotes: DOMRect[];
        notesOn: string[];
    })[];
    protected _measures: (MeasureTimemapEntry & {
        eventEntry: number;
        measureId: string;
        systemId: string;
        rectMeasure: DOMRect;
        rectSystem: DOMRect;
    })[];
    protected _currentNotes: {
        domid: string;
        fill: string | null;
        stroke: string | null;
    }[];
    protected _currentLocation: {
        index: MeasureIndex;
        start: MillisecsTimestamp;
        offset: MillisecsTimestamp;
        duration?: MillisecsTimestamp | undefined;
    };
    protected _currentEventEntry: number;
    protected _currentScrollOffset?: number;
    constructor();
    protected _recalculate(container: HTMLElement, timemap: TimeMapEntryFixed[], svgs: string[], options: PlayerOptions): void;
    protected _refresh(): void;
    protected _move(index: MeasureIndex, start: MillisecsTimestamp, offset: MillisecsTimestamp, duration?: MillisecsTimestamp): void;
}
//# sourceMappingURL=VerovioRendererBase.d.ts.map