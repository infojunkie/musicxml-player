export interface IMidiConverter {
  version(): Promise<string>;
  convert(musicXml: string): Promise<ArrayBuffer>;
}
