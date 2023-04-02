import type { IMidiConverter } from './IMidiConverter';
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';

export class VerovioConverter implements IMidiConverter {
  private vrv: VerovioToolkit | null;

  constructor() {
    this.vrv = null;
  }

  async version(): Promise<string> {
    if (!this.vrv) {
      this.vrv = await VerovioConverter._create();
    }
    return `verovio v${this.vrv.getVersion()}`;
  }

  async convert(musicXml: string): Promise<ArrayBuffer> {
    if (!this.vrv) {
      this.vrv = await VerovioConverter._create();
    }
    this.vrv.setOptions({
      expand: 'expansion-repeat'
    });
    if (!this.vrv.loadData(musicXml)) {
      throw 'TODO';
    }
    return VerovioConverter._base64ToArrayBuffer(this.vrv.renderToMIDI());
  }

  static async _create(): Promise<VerovioToolkit> {
    const VerovioModule = await createVerovioModule();
    return new VerovioToolkit(VerovioModule);
  }

  static _base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
