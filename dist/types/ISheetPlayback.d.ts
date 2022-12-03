export interface ISheetPlayback {
    initialize(musicXml: string, container: HTMLDivElement | string): Promise<void>;
    moveToMeasureTime(measureIndex: number, measureMillisecs: number): void;
}
//# sourceMappingURL=ISheetPlayback.d.ts.map