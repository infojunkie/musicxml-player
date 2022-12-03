// import { AudioContext } from 'standardized-audio-context';
// import * as WebAudioFontPlayer from 'webaudiofont';

// const MIDI_DRUMS = 9;

export class SoundFontOutput {
  // constructor(json) {
  //   this.audioContext = new AudioContext();
  //   this.player = new WebAudioFontPlayer();
  //   this.notes = [];
  //   this.channels = json.tracks.reduce((channels, track) => {
  //     const pc = track.find(e => 'programChange' in e);
  //     if (pc) {
  //       if (pc.channel !== MIDI_DRUMS) {
  //         const instrumentNumber = this.player.loader.findInstrument(pc.programChange.programNumber);
  //         const instrumentInfo = this.player.loader.instrumentInfo(instrumentNumber);
  //         channels[pc.channel] = { instrumentInfo };
  //         this.player.loader.startLoad(this.audioContext, instrumentInfo.url, instrumentInfo.variable);
  //       }
  //       else {
  //         channels[MIDI_DRUMS] = { beats: {} };
  //         [...new Set(track.filter(e => 'noteOn' in e).map(e => e.noteOn.noteNumber))].forEach(beat => {
  //           const drumNumber = this.player.loader.findDrum(beat);
  //           const drumInfo = this.player.loader.drumInfo(drumNumber);
  //           channels[MIDI_DRUMS].beats[beat] = { drumInfo };
  //           this.player.loader.startLoad(this.audioContext, drumInfo.url, drumInfo.variable);
  //         });
  //       }
  //     }
  //     return channels;
  //   }, {});

  //   // Perform our own note scheduling.
  //   const scheduleNotes = () => {
  //     const now = performance.now();
  //     // Module `webaudiofont` seems to drop notes randomly when they become too crowded.
  //     // The commented code below was an experiment to rely on our own scheduling to instruct `webaudiofont` to play
  //     // the notes immediately, instead of queueing them on the module's side. This experiment worked better in some cases,
  //     // but failed miserably in others because more notes were dropped when scheduled immediately as per the commented code below.
  //     // The currently used method is to queue the notes in `webaudiofont` when they are received in the method `noteOn()`.
  //     //
  //     // this.notes.filter(note => note.envelope === null && note.on <= now).forEach(note => {
  //     //   const instrument = note.channel === MIDI_DRUMS ?
  //     //     this.channels[note.channel].beats[note.pitch].drumInfo.variable :
  //     //     this.channels[note.channel].instrumentInfo.variable;
  //     //   note.envelope = this.player.queueWaveTable(this.audioContext, this.audioContext.destination, window[instrument], 0, note.pitch, 100000, note.velocity / 127);
  //     // })
  //     this.notes.filter(note => note.off !== null && note.off <= now).forEach(note => note.envelope.cancel());
  //     this.notes = this.notes.filter(note => note.off === null || note.off > now);
  //     workerTimers.setTimeout(scheduleNotes, 25);
  //   }
  //   workerTimers.setTimeout(scheduleNotes, 25);
  // }

  // send(data, timestamp) {
  //   const channel = data[0] & 0xf;
  //   const type = data[0] >> 4;
  //   const pitch = data[1];
  //   const velocity = data[2];
  //   switch (type) {
  //     case 9:
  //     if (velocity > 0) {
  //       this.noteOn(channel, pitch, timestamp, velocity);
  //     }
  //     else {
  //       this.noteOff(channel, pitch, timestamp);
  //     }
  //     break;
  //     case 8:
  //     this.noteOff(channel, pitch, timestamp);
  //     break;
  //   }
  //   if (data.length > 3) {
  //     this.send(data.slice(3), timestamp);
  //   }
  // }

  // noteOn(channel, pitch, timestamp, velocity) {
  //   // Refer to the discussion in `scheduleNotes()` about queuing the notes in `webaudiofont`,
  //   // as opposed to scheduling them ourselves. For now, we're doing the former which drop some notes, but overall works better.
  //   //
  //   // this.notes.push({ channel, pitch, velocity, on: timestamp, envelope: null, off: null });
  //   const instrument = channel === MIDI_DRUMS ?
  //   this.channels[channel].beats[pitch].drumInfo.variable :
  //   this.channels[channel].instrumentInfo.variable;
  //   const when = this.audioContext.currentTime + (timestamp - performance.now()) / 1000;
  //   this.notes.push({
  //     channel, pitch, velocity, on: timestamp, off: null,
  //     envelope: this.player.queueWaveTable(this.audioContext, this.audioContext.destination, window[instrument], when, pitch, 100000, velocity / 127)
  //   });
  // }

  // noteOff(channel, pitch, timestamp) {
  //   const note = this.notes.find(note => note.pitch === pitch && note.channel === channel && note.off === null);
  //   if (note) {
  //     note.off = timestamp;
  //   }
  // }

  // clear() {
  //   this.player.cancelQueue(this.audioContext);
  //   this.notes = [];
  // }
}
