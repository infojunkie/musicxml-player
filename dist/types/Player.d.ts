import type { ISheetPlayback } from './ISheetPlayback';
export declare class Player {
    private musicXml;
    private container;
    static load(musicXml: string, container: HTMLDivElement | string): Promise<Player>;
    playback: ISheetPlayback;
    constructor(musicXml: string, container: HTMLDivElement | string);
    initialize(): Promise<void>;
    seek(measure: number, millisecs: number): void;
}
//# sourceMappingURL=Player.d.ts.map