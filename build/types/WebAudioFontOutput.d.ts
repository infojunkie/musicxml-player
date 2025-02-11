import { IAudioContext } from 'standardized-audio-context';
import type { IMidiFile, IMidiNoteOnEvent, IMidiNoteOffEvent, IMidiPitchBendEvent } from 'midi-json-parser-worker';
import type { IMidiOutput } from 'midi-player';
type InstrumentMap = Record<number, {
    instrumentInfo?: any;
    beats?: {
        drumInfo: any;
    }[];
}>;
type Note = {
    channel: number;
    pitch: number;
    velocity: number;
    timestamp: number;
    when: number;
    off: number | null;
    envelope: any;
};
type PitchBend = {
    channel: number;
    pitchBend: number;
    timestamp: number;
    when: number;
};
export declare class WebAudioFontOutput implements IMidiOutput {
    protected _audioContext: IAudioContext;
    protected _player: any;
    protected _notes: Array<Note>;
    protected _instruments: InstrumentMap;
    protected _pitchBends: Array<PitchBend>;
    constructor(midiJson: IMidiFile);
    clear(): void;
    initialize(): Promise<void>;
    send(data: number[] | Uint8Array, timestamp: number): void;
    protected _noteOn(event: IMidiNoteOnEvent, timestamp: number): void;
    protected _noteOff(event: IMidiNoteOffEvent, timestamp: number): void;
    protected _pitchBend(event: IMidiPitchBendEvent, timestamp: number): void;
    protected _timestampToAudioContext(timestamp: number): number;
}
export {};
//# sourceMappingURL=WebAudioFontOutput.d.ts.map