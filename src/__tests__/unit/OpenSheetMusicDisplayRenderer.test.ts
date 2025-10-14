import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenSheetMusicDisplayRenderer } from '../../OpenSheetMusicDisplayRenderer';
import { resetGlobals, installArrayPolyfills } from '../helpers/test-utils';

vi.mock('opensheetmusicdisplay', () => {
  // Create mock objects directly here instead of calling imported functions
  const cursor = {
    show: vi.fn(),
    reset: vi.fn(),
    update: vi.fn(),
    set iterator(_: any) {},
  } as any;
  const calculator: any = { beamsNeedUpdate: false };
  const measure = {
    AbsoluteTimestamp: { clone: () => ({ Add: vi.fn() }) },
    VerticalSourceStaffEntryContainers: [{}],
    parentSourceMeasure: { AbsoluteTimestamp: { RealValue: 0 } },
    TempoInBPM: 60,
  } as any;
  const osmd = {
    EngravingRules: {
      ChordAccidentalTexts: {},
      ChordSymbolLabelTexts: {},
      resetChordAccidentalTexts: vi.fn(),
      resetChordSymbolLabelTexts: vi.fn(),
    },
    GraphicSheet: {
      GetCalculator: calculator,
      MeasureList: [
        [
          {
            staffEntries: [
              {
                graphicalVoiceEntries: [
                  { vfStaveNote: { getAttribute: () => null } },
                ],
                parentSourceMeasure: measure,
                relInMeasureTimestamp: { RealValue: 0 },
              },
            ],
            parentSourceMeasure: measure,
          },
        ],
      ],
    },
    IsReadyToRender: () => true,
    Sheet: { SourceMeasures: [measure] },
    cursor,
    load: vi.fn(async () => {}),
    render: vi.fn(),
    clear: vi.fn(),
    Version: 'X.Y.Z',
  } as any;

  class OpenSheetMusicDisplayMock {
    constructor(_container: HTMLElement, _options?: any) {
      Object.assign(this, osmd);
    }
  }
  return {
    OpenSheetMusicDisplay: OpenSheetMusicDisplayMock,
    EngravingRules: class {},
    VexFlowMusicSheetCalculator: class {},
    MusicPartManagerIterator: class {},
  };
});

describe('OpenSheetMusicDisplayRenderer', () => {
  beforeEach(() => {
    resetGlobals();
    installArrayPolyfills();
  });

  it('initializes OSMD and exposes version', async () => {
    const renderer = new OpenSheetMusicDisplayRenderer();
    const container = document.createElement('div');
    await renderer.initialize(container, '<xml/>', {
      container,
      musicXml: '<xml/>',
      renderer: {} as any,
      converter: {} as any,
      output: null,
      soundfontUri: '',
      unrollXslUri: '',
      timemapXslUri: '',
      unroll: false,
      mute: false,
      repeat: 1,
      velocity: 1,
      horizontal: false,
      followCursor: true,
      xsltProcessor: {} as any,
    });
    expect(renderer.version).toContain('opensheetmusicdisplay');
  });

  it('snapshots OSMD renderer initialization and properties', async () => {
    const renderer = new OpenSheetMusicDisplayRenderer();
    const container = document.createElement('div');
    await renderer.initialize(container, '<xml/>', {
      container,
      musicXml: '<xml/>',
      renderer: {} as any,
      converter: {} as any,
      output: null,
      soundfontUri: '',
      unrollXslUri: '',
      timemapXslUri: '',
      unroll: false,
      mute: false,
      repeat: 1,
      velocity: 1,
      horizontal: false,
      followCursor: true,
      xsltProcessor: {} as any,
    });

    expect({
      version: renderer.version,
      containerHTML: container.innerHTML,
      hasOSMDInstance: !!renderer['_osmd'],
    }).toMatchSnapshot();
  });
});
