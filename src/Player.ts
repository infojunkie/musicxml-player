import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export class Player {
    static load(musicXml: string, container: HTMLDivElement | string) : Player {
        return new Player(musicXml, container);
    }

    private osmd: OpenSheetMusicDisplay;

    constructor(private musicXml: string, private container: HTMLDivElement | string) {
        this.osmd = new OpenSheetMusicDisplay(this.container);
        this.osmd.load(this.musicXml);
    }
}
