export * from './Player';

export async function midiOutputs(): Promise<Array<WebMidi.MIDIOutput>> {
  if (navigator.requestMIDIAccess) {
    return new Promise((resolve) => {
      navigator.requestMIDIAccess().then(
        (midi) => {
          resolve([...midi.outputs.values()]);
        },
        (err) => {
          console.error(`Error initializing Web MIDI: ${err}`);
          resolve([]);
        },
      );
    });
  }
  return [];
}
