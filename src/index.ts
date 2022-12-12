export * from './Player';

export async function midiOutputs(): Promise<Array<WebMidi.MIDIOutput>> {
  if (navigator.requestMIDIAccess) {
    return new Promise((resolve, reject) => {
      navigator.requestMIDIAccess().then(
        (midi) => {
          resolve([...midi.outputs.values()]);
        },
        (err) => reject(err),
      );
    });
  }
  return [];
}
