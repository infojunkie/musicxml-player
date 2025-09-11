import { MeasureTimemapEntry } from './IMIDIConverter';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import { Cursor } from './Cursor';
import type { TimeMapEntryFixed } from './VerovioTypes';
export declare class VerovioRendererHelper {
    player?: Player;
    protected _container?: HTMLElement;
    protected _cursor: Cursor;
    protected _scale: boolean;
    protected _svgs: string[];
    protected _events?: (TimeMapEntryFixed & {
        measureEntry: number;
        rectNotes: DOMRect[];
        notesOn: string[];
    })[];
    protected _measures: (MeasureTimemapEntry & {
        eventEntry: number;
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
    constructor();
    protected _calculate(container: HTMLElement, timemap: TimeMapEntryFixed[], svgs: string[], scale?: boolean): void;
    protected _recalculate(): void;
    protected _move(index: MeasureIndex, start: MillisecsTimestamp, offset: MillisecsTimestamp, duration?: MillisecsTimestamp): void;
}
//# sourceMappingURL=VerovioRendererHelper.d.ts.map