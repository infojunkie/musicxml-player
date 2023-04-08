import { parseArrayBuffer as parseMidiBuffer } from 'midi-json-parser';
import type { IMidiFile } from 'midi-json-parser-worker';
import type { IMidiConverter, MeasureTimemap } from './IMidiConverter';
import pkg from '../package.json';
import { fetish } from './helpers';

export class FetchConverter implements IMidiConverter {
  private _timemap: MeasureTimemap;
  private _midi: IMidiFile | null;

  constructor(private _midiOrUri: IMidiFile | string, private _timemapOrUri: MeasureTimemap | string) {
    this._timemap = [];
    this._midi = null;
  }

  async initialize(): Promise<void> {
    this._timemap = typeof this._timemapOrUri === 'string' ?
      <MeasureTimemap>(
        await (await fetish(this._timemapOrUri)).json()
      ) : this._timemapOrUri;
    this._midi = typeof this._midiOrUri === 'string' ?
      await parseMidiBuffer(
        await (await fetish(this._midiOrUri)).arrayBuffer()
      ) : this._midiOrUri;
  }

  get midi(): IMidiFile {
    if (!this._midi) throw 'TODO';
    return this._midi;
  }

  get timemap(): MeasureTimemap {
    return this._timemap;
  }

  get version(): string {
    return `${pkg.name} v${pkg.version}`;
  }
}
