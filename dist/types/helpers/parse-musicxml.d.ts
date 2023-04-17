declare type MusicXmlAndTitle = {
    musicXml: string;
    title: string | null;
};
export declare function parseMusicXml(musicXmlOrBuffer: ArrayBuffer | string): Promise<MusicXmlAndTitle | null>;
export {};
//# sourceMappingURL=parse-musicxml.d.ts.map