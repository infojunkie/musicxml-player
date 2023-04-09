import * as fs from 'fs';
import { encode } from 'json-midi-message-encoder';
import { IMidiFile, TMidiEvent } from 'midi-json-parser-worker';
import { parseMidiFile, parseMidiEvent } from './parse-midi';

const encodeMidiMessage = (event: TMidiEvent): Uint8Array => {
  return new Uint8Array(encode(event));
};

describe('parse-midi', async () => {
  it('should correctly parse', async () => {
    const midiJson = <IMidiFile>(
      parseMidiFile(fs.readFileSync('./demo/data/asa-branca.mid', null).buffer)
    );
    midiJson.tracks.forEach((track) => {
      {
        track.forEach((event) => {
          parseMidiEvent(encodeMidiMessage(event));
        });
      }
    });
  });
});
