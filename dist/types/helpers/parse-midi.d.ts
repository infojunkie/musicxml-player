import type { IMidiChannelPrefixEvent, IMidiChannelPressureEvent, IMidiControlChangeEvent, IMidiCopyrightNoticeEvent, IMidiCuePointEvent, IMidiDeviceNameEvent, IMidiEndOfTrackEvent, IMidiInstrumentNameEvent, IMidiKeyPressureEvent, IMidiKeySignatureEvent, IMidiLyricEvent, IMidiMarkerEvent, IMidiMidiPortEvent, IMidiNoteOffEvent, IMidiNoteOnEvent, IMidiPitchBendEvent, IMidiProgramChangeEvent, IMidiProgramNameEvent, IMidiSequencerSpecificEvent, IMidiSetTempoEvent, IMidiSmpteOffsetEvent, IMidiSysexEvent, IMidiTextEvent, IMidiTimeSignatureEvent, IMidiTrackNameEvent, TMidiEvent } from 'midi-json-parser-worker';
/**
 * Parse single MIDI event into JSON object.
 */
export declare function parseMidiEvent(data: number[] | Uint8Array): TMidiEvent;
/**
 * Parse full MIDI file into JSON object.
 *
 * Copied from https://github.com/chrisguttandin/midi-json-parser-worker
 * because the original code only runs in a Web Worker.
 */
export declare const parseMidiFile: (arrayBuffer: ArrayBuffer) => {
    division: number;
    format: number;
    tracks: (IMidiChannelPrefixEvent | IMidiCopyrightNoticeEvent | IMidiCuePointEvent | IMidiDeviceNameEvent | IMidiEndOfTrackEvent | IMidiInstrumentNameEvent | IMidiKeySignatureEvent | IMidiLyricEvent | IMidiMarkerEvent | IMidiMidiPortEvent | IMidiProgramNameEvent | IMidiSequencerSpecificEvent | IMidiSetTempoEvent | IMidiSmpteOffsetEvent | IMidiTextEvent | IMidiTimeSignatureEvent | IMidiTrackNameEvent | IMidiChannelPressureEvent | IMidiControlChangeEvent | IMidiKeyPressureEvent | IMidiNoteOffEvent | IMidiNoteOnEvent | IMidiPitchBendEvent | IMidiProgramChangeEvent | IMidiSysexEvent)[][];
};
//# sourceMappingURL=parse-midi.d.ts.map