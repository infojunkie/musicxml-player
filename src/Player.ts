import type { ISheetPlayback } from "./ISheetPlayback";
import { OpenSheetMusicDisplayPlayback } from "./OpenSheetMusicDisplayPlayback";

export class Player {
  static async load(musicXml: string, container: HTMLDivElement | string): Promise<Player> {
    const player = new Player(musicXml, container);
    await player.initialize();
    return player;
  }

  playback: ISheetPlayback;

  constructor(
    private musicXml: string,
    private container: HTMLDivElement | string,
  ) {
    console.log('here');
    this.playback = new OpenSheetMusicDisplayPlayback(this);
  }

  async initialize() {
    await this.playback.initialize(this.musicXml, this.container);
  }

  seek(measure: number, millisecs: number) {
    console.log(measure, millisecs);
  }
}
