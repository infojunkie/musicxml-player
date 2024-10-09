import { assertIsDefined } from './helpers';
import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player } from './Player';
import {
  Fraction,
  IOSMDOptions,
  MusicPartManagerIterator,
  OpenSheetMusicDisplay,
  SourceMeasure,
  VexFlowVoiceEntry,
  VexFlowMusicSheetCalculator,
  EngravingRules,
} from 'opensheetmusicdisplay';

export type EngravingRulesOptions = {
  [Prop in keyof EngravingRules]: EngravingRules[Prop];
};

/**
 * Implementation of ISheetRenderer that uses OpenSheetMusicDisplay @see https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
 */
export class OpenSheetMusicDisplayRenderer implements ISheetRenderer {
  player?: Player;
  private _osmd: OpenSheetMusicDisplay | undefined;
  private _currentMeasureIndex: MeasureIndex = 0;
  private _currentVoiceEntryIndex: number = 0;
  private _options: IOSMDOptions;

  constructor(
    options?: IOSMDOptions,
    private _rules?: EngravingRulesOptions,
  ) {
    this._options = {
      ...{
        backend: 'svg',
        drawFromMeasureNumber: 1,
        drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER, // draw all measures, up to the end of the sample
        drawMeasureNumbers: false,
        newSystemFromXML: false,
        newPageFromXML: false,
        followCursor: true,
        disableCursor: false,
        autoResize: false,
      },
      ...options,
    };
  }

  destroy(): void {
    if (!this._osmd) return;
    this._osmd.clear();
    this._osmd = undefined;
  }

  async initialize(container: HTMLElement, musicXml: string): Promise<void> {
    this._osmd = new OpenSheetMusicDisplay(container, this._options);
    if (this._rules) {
      let k: keyof EngravingRules;
      for (k in this._rules) {
        (this._osmd.EngravingRules as any)[k] = this._rules[k];
      }
    }
    // FIXME: Avoid hard-coding these engraving rules.
    this._osmd.EngravingRules.resetChordAccidentalTexts(
      this._osmd.EngravingRules.ChordAccidentalTexts,
      true,
    );
    this._osmd.EngravingRules.resetChordSymbolLabelTexts(
      this._osmd.EngravingRules.ChordSymbolLabelTexts,
    );
    await this._osmd.load(musicXml);
    this._redraw();
  }

  moveTo(
    index: MeasureIndex,
    _start: MillisecsTimestamp,
    offset: MillisecsTimestamp,
    _duration?: MillisecsTimestamp,
  ): void {
    assertIsDefined(this._osmd);
    const measure = this._osmd.Sheet.SourceMeasures[index];

    // Find the time within the measure.
    for (
      let v = measure.VerticalSourceStaffEntryContainers.length - 1;
      v >= 0;
      v--
    ) {
      const vsse = measure.VerticalSourceStaffEntryContainers[v]!;

      if (
        this._timestampToMillisecs(measure, vsse.Timestamp) <=
        offset + Number.EPSILON
      ) {
        // If same staff entry, do nothing.
        if (
          this._currentMeasureIndex !== index ||
          this._currentVoiceEntryIndex !== v
        ) {
          this._updateCursor(index, v);
        }
        return;
      }
    }
    console.error(
      `[OpenSheetMusicDisplayRenderer.moveTo] Could not find suitable staff entry at time ${offset} for measure ${index}`,
    );
  }

  resize(): void {
    if (this._osmd) {
      this._redraw();
    }
  }

  get version(): string {
    assertIsDefined(this._osmd);
    return `opensheetmusicdisplay v${this._osmd.Version}`;
  }

  private _redraw() {
    assertIsDefined(this._osmd);
    if (
      this._osmd.GraphicSheet?.GetCalculator instanceof
      VexFlowMusicSheetCalculator
    ) {
      (
        this._osmd.GraphicSheet.GetCalculator as VexFlowMusicSheetCalculator
      ).beamsNeedUpdate = true;
    }
    if (this._osmd.IsReadyToRender()) {
      this._osmd.render();
      this._osmd.cursor.show();
    }

    // Setup event listeners for target stave notes to position the cursor.
    this._osmd.GraphicSheet.MeasureList?.forEach((measureGroup, index) => {
      measureGroup?.forEach((measure) => {
        measure?.staffEntries?.forEach((se, _v) => {
          se.graphicalVoiceEntries?.forEach((gve) => {
            const vfve = <VexFlowVoiceEntry>gve;
            (<HTMLElement>(
              vfve.vfStaveNote?.getAttribute('el')
            ))?.addEventListener('click', () => {
              this.player?.moveTo(
                index,
                this._timestampToMillisecs(
                  measure.parentSourceMeasure,
                  measure.parentSourceMeasure.AbsoluteTimestamp,
                ),
                this._timestampToMillisecs(
                  measure.parentSourceMeasure,
                  se.relInMeasureTimestamp,
                ),
              );
            });
          });
        });
      });
    });
  }

  // Staff entry timestamp to actual time relative to measure start.
  private _timestampToMillisecs(measure: SourceMeasure, timestamp: Fraction) {
    return (timestamp.RealValue * 4 * 60 * 1000) / measure.TempoInBPM;
  }

  private _updateCursor(index: number, voiceEntryIndex: number) {
    assertIsDefined(this._osmd);
    const measure = this._osmd.Sheet.SourceMeasures[index]!;
    const vsse = measure.VerticalSourceStaffEntryContainers[voiceEntryIndex]!;

    this._currentMeasureIndex = index;
    this._currentVoiceEntryIndex = voiceEntryIndex;

    if (index === 0 && voiceEntryIndex === 0) {
      this._osmd.cursor.reset();
    } else {
      const startTimestamp = measure.AbsoluteTimestamp.clone();
      startTimestamp.Add(vsse.Timestamp);
      this._osmd.cursor.iterator = new MusicPartManagerIterator(
        this._osmd.Sheet,
        startTimestamp,
        undefined,
      );
      this._osmd.cursor.update();
    }
  }
}
