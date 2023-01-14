import type { ISheetPlayback } from './ISheetPlayback';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import {
  Fraction,
  MusicPartManagerIterator,
  OpenSheetMusicDisplay,
  SourceMeasure,
  VexFlowVoiceEntry,
} from 'opensheetmusicdisplay';

export class OpenSheetMusicDisplayPlayback implements ISheetPlayback {
  private player: Player | null;
  private osmd: OpenSheetMusicDisplay | null;
  private currentMeasureIndex: MeasureIndex;
  private currentVoiceEntryIndex: number;

  constructor() {
    this.player = null;
    this.osmd = null;
    this.currentMeasureIndex = 0;
    this.currentVoiceEntryIndex = 0;
  }

  version(): string {
    if (!this.osmd) throw 'TODO';
    return `opensheetmusicdisplay v${this.osmd.Version}`;
  }

  async initialize(
    player: Player,
    container: HTMLDivElement | string,
    musicXml: string,
  ): Promise<void> {
    this.player = player;
    this.osmd = new OpenSheetMusicDisplay(container, {
      backend: 'svg',
      drawFromMeasureNumber: 1,
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER, // draw all measures, up to the end of the sample
      newSystemFromXML: true,
      newPageFromXML: true,
      followCursor: true,
      disableCursor: false,
      autoResize: false,
    });
    this.osmd.EngravingRules.resetChordAccidentalTexts(
      this.osmd.EngravingRules.ChordAccidentalTexts,
      true,
    );
    this.osmd.EngravingRules.resetChordSymbolLabelTexts(
      this.osmd.EngravingRules.ChordSymbolLabelTexts,
    );
    await this.osmd.load(musicXml);
    this.osmd.render();
    this.osmd.cursor.show();

    // Setup event listeners for target stave notes to position the cursor.
    this.osmd.GraphicSheet.MeasureList?.forEach(
      (measureGroup, measureIndex) => {
        measureGroup?.forEach((measure) => {
          measure?.staffEntries?.forEach((se, v) => {
            se.graphicalVoiceEntries?.forEach((gve) => {
              const vfve = <VexFlowVoiceEntry>gve;
              (<HTMLElement>(
                vfve.vfStaveNote?.getAttribute('el')
              ))?.addEventListener('click', () => {
                this.updateCursor(measureIndex, v);
                this.player!.move(
                  measureIndex,
                  this.timestampToMillisecs(
                    measure.parentSourceMeasure,
                    se.relInMeasureTimestamp,
                  ),
                );
              });
            });
          });
        });
      },
    );
  }

  // Staff entry timestamp to actual time relative to measure start.
  timestampToMillisecs(measure: SourceMeasure, timestamp: Fraction) {
    return (timestamp.RealValue * 4 * 60 * 1000) / measure.TempoInBPM;
  }

  updateCursor(measureIndex: number, voiceEntryIndex: number) {
    const osmd = this.osmd!;
    const measure = osmd.Sheet.SourceMeasures[measureIndex]!;
    const vsse = measure.VerticalSourceStaffEntryContainers[voiceEntryIndex]!;

    this.currentMeasureIndex = measureIndex;
    this.currentVoiceEntryIndex = voiceEntryIndex;

    if (measureIndex === 0 && voiceEntryIndex === 0) {
      osmd.cursor.reset();
    } else {
      const startTimestamp = measure.AbsoluteTimestamp.clone();
      startTimestamp.Add(vsse.Timestamp);
      osmd.cursor.iterator = new MusicPartManagerIterator(
        osmd.Sheet,
        startTimestamp,
        undefined,
      );
      osmd.cursor.update();
    }
  }

  seek(measureIndex: MeasureIndex, measureMillisecs: MillisecsTimestamp): void {
    const osmd = this.osmd!;
    const measure = osmd.Sheet.SourceMeasures[measureIndex]!;

    // If we're moving to a new measure, then start at the first staff entry without search.
    if (this.currentMeasureIndex !== measureIndex) {
      this.updateCursor(measureIndex, 0);
      return;
    }

    // Same measure, new time.
    for (
      let v = measure.VerticalSourceStaffEntryContainers.length - 1;
      v >= 0;
      v--
    ) {
      const vsse = measure.VerticalSourceStaffEntryContainers[v]!;

      if (
        this.timestampToMillisecs(measure, vsse.Timestamp) <=
        measureMillisecs + Number.EPSILON
      ) {
        // If same staff entry, do nothing.
        if (this.currentVoiceEntryIndex !== v) {
          this.updateCursor(measureIndex, v);
        }
        return;
      }
    }
    console.error(
      `Could not find suitable staff entry at time ${measureMillisecs} for measure ${measureIndex}`,
    );
  }
}
