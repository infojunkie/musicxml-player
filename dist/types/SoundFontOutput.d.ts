import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiOutput } from 'midi-player';
export declare class SoundFontOutput implements IMidiOutput {
    private audioContext;
    private player;
    private notes;
    private channels;
    constructor(midiJson: IMidiFile);
    send(data: number[] | Uint8Array, timestamp: number): void;
    private noteOn;
    private noteOff;
    clear(): void;
}
//# sourceMappingURL=SoundFontOutput.d.ts.map