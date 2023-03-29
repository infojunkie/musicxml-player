import type { IMidiConverter } from './IMidiConverter';
import pkg from '../package.json';

export class FetchConverter implements IMidiConverter {
  constructor(private midiUri: string) {}

  version(): Promise<string> {
    return Promise.resolve(`${pkg.name} v${pkg.version}`);
  }

  async convert(): Promise<ArrayBuffer> {
    return await (await fetch(this.midiUri)).arrayBuffer();
  }
}
