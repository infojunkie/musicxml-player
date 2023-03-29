import type { IMidiConverter } from './IMidiConverter';

export class MmaConverter implements IMidiConverter {
  constructor(private apiUri: string) {}

  async version(): Promise<string> {
    const version = await (await fetch(`${this.apiUri}/`)).json();
    return `${version.name} v${version.version}`;
  }

  async convert(musicXml: string): Promise<ArrayBuffer> {
    const formData = new FormData();
    formData.append('musicXml', new Blob([musicXml], { type: 'text/xml' }));
    const response = await fetch(`${this.apiUri}/convert`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(response.statusText);
    return await response.arrayBuffer();
  }
}
