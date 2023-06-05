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
  private _player: Player | null;
  private _osmd: OpenSheetMusicDisplay | null;
  private _currentMeasureIndex: MeasureIndex;
  private _currentVoiceEntryIndex: number;
  private _options: IOSMDOptions;

  constructor(options?: IOSMDOptions, private _rules?: EngravingRulesOptions) {
    this._player = null;
    this._osmd = null;
    this._currentMeasureIndex = 0;
    this._currentVoiceEntryIndex = 0;
    this._options = {
      ...{
        backend: 'svg',
        drawFromMeasureNumber: 1,
        drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER, // draw all measures, up to the end of the sample
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
    this._osmd = null;
  }

  async initialize(
    player: Player,
    container: HTMLElement,
    musicXml: string,
  ): Promise<void> {
    this._player = player;
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
    measureIndex: MeasureIndex,
    _: MillisecsTimestamp,
    measureOffset: MillisecsTimestamp,
  ): void {
    if (!this._osmd) throw 'TODO';
    const measure = this._osmd.Sheet.SourceMeasures[measureIndex]!;

    // If we're moving to a new measure, then start at the first staff entry without search.
    if (this._currentMeasureIndex !== measureIndex) {
      this._updateCursor(measureIndex, 0);
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
        this._timestampToMillisecs(measure, vsse.Timestamp) <=
        measureOffset + Number.EPSILON
      ) {
        // If same staff entry, do nothing.
        if (this._currentVoiceEntryIndex !== v) {
          this._updateCursor(measureIndex, v);
        }
        return;
      }
    }
    console.error(
      `Could not find suitable staff entry at time ${measureOffset} for measure ${measureIndex}`,
    );
  }

  resize(): void {
    if (this._osmd) {
      this._redraw();
    }
  }

  get version(): string {
    if (!this._osmd) throw 'TODO';
    return `opensheetmusicdisplay v${this._osmd.Version}`;
  }

  private _redraw() {
    if (!this._osmd) throw 'TODO';
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
    this._osmd.GraphicSheet.MeasureList?.forEach(
      (measureGroup, measureIndex) => {
        measureGroup?.forEach((measure) => {
          measure?.staffEntries?.forEach((se, v) => {
            se.graphicalVoiceEntries?.forEach((gve) => {
              const vfve = <VexFlowVoiceEntry>gve;
              (<HTMLElement>(
                vfve.vfStaveNote?.getAttribute('el')
              ))?.addEventListener('click', () => {
                this._updateCursor(measureIndex, v);
                this._player?.moveTo(
                  measureIndex,
                  this._timestampToMillisecs(
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
  private _timestampToMillisecs(measure: SourceMeasure, timestamp: Fraction) {
    return (timestamp.RealValue * 4 * 60 * 1000) / measure.TempoInBPM;
  }

  private _updateCursor(measureIndex: number, voiceEntryIndex: number) {
    if (!this._osmd) throw 'TODO';
    const measure = this._osmd.Sheet.SourceMeasures[measureIndex]!;
    const vsse = measure.VerticalSourceStaffEntryContainers[voiceEntryIndex]!;

    this._currentMeasureIndex = measureIndex;
    this._currentVoiceEntryIndex = voiceEntryIndex;

    if (measureIndex === 0 && voiceEntryIndex === 0) {
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
