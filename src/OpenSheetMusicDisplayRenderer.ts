import { assertIsDefined } from './helpers';
import type { ISheetRenderer } from './ISheetRenderer';
import type { MeasureIndex, MillisecsTimestamp, Player, PlayerOptions } from './Player';
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
  protected _osmd: OpenSheetMusicDisplay | undefined;
  protected _currentMeasureIndex: MeasureIndex = 0;
  protected _currentVoiceEntryIndex: number = 0;
  protected _osmdOptions: IOSMDOptions;

  constructor(
    osmdOptions?: IOSMDOptions,
    protected _engravingOptions?: EngravingRulesOptions,
  ) {
    this._osmdOptions = { ...osmdOptions };
  }

  destroy(): void {
    if (!this._osmd) return;
    this._osmd.clear();
    this._osmd = undefined;
  }

  async initialize(container: HTMLElement, musicXml: string, options: Required<PlayerOptions>): Promise<void> {
    // Adjust options based on PlayerOptions.
    this._osmdOptions = {
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
        renderSingleHorizontalStaffline: options.horizontal
      },
      ...this._osmdOptions
    }

    // Create the OSMD toolkit.
    this._osmd = new OpenSheetMusicDisplay(container, this._osmdOptions);
    if (this._engravingOptions) {
      let k: keyof EngravingRules;
      for (k in this._engravingOptions) {
        (this._osmd.EngravingRules as any)[k] = this._engravingOptions[k];
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

  onResize(): void {
    if (this._osmd) {
      this._redraw();
    }
  }

  onEvent(): void {}

  get version(): string {
    assertIsDefined(this._osmd);
    return `opensheetmusicdisplay v${this._osmd.Version}`;
  }

  protected _redraw() {
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
  protected _timestampToMillisecs(measure: SourceMeasure, timestamp: Fraction) {
    return (timestamp.RealValue * 4 * 60 * 1000) / measure.TempoInBPM;
  }

  protected _updateCursor(index: number, voiceEntryIndex: number) {
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
