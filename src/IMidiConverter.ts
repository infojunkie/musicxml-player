export interface IMidiConverter {
  version(): string;
  convert(musicXml: string): Promise<ArrayBuffer>;
}
