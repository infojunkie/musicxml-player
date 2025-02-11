import { encode } from 'json-midi-message-encoder';
import { parseMidiFile, parseMidiEvent, fetish} from '../../build/musicxml-player';

const encodeMidiMessage = (event) => {
  return new Uint8Array(encode(event));
};

describe('parse-midi', async () => {
  it('should correctly parse', async () => {
    const midiJson = parseMidiFile(await (await fetish('demo/data/asa-branca.mid')).arrayBuffer());
    midiJson.tracks.forEach((track) => {
      {
        track.forEach((event) => {
          parseMidiEvent(encodeMidiMessage(event));
        });
      }
    });
  });
});
