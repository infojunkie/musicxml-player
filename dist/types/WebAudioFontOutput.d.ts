import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiOutput } from 'midi-player';
export declare class WebAudioFontOutput implements IMidiOutput {
    private _audioContext;
    private _player;
    private _notes;
    private _instruments;
    private _pitchBends;
    constructor(midiJson: IMidiFile);
    clear(): void;
    initialize(): Promise<void>;
    send(data: number[] | Uint8Array, timestamp: number): void;
    private _noteOn;
    private _noteOff;
    private _pitchBend;
    private _timestampToAudioContext;
}
//# sourceMappingURL=WebAudioFontOutput.d.ts.map