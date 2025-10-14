import { beforeEach, afterEach, vi } from 'vitest';

// Minimal valid MusicXML for tests
export const SAMPLE_MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1"><part-name>Music</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

// Minimal timemap JSON as string returned from XSLT transform
export const SAMPLE_TIMEMAP_JSON = JSON.stringify([
  { measure: 0, timestamp: 0, duration: 1000 },
]);

// Minimal timemap array for direct-use tests
export const SAMPLE_TIMEMAP = [{ measure: 0, timestamp: 0, duration: 1000 }];

// Minimal MIDI: Basic binary content (arraybuffer)
export function createDummyMidiBuffer(): ArrayBuffer {
  return new Uint8Array([0, 1, 2, 3]).buffer;
}

// Create a mock IXSLTProcessor compatible with our interface
export function createMockXsltProcessor() {
  return {
    parse: vi.fn(async ({ text }: { text: string }) => ({ __doc: text })),
    query: vi.fn((xpath: string, _doc: any) => {
      if (xpath === '//events/event') {
        return [
          { getAttribute: (n: string) => (n === 'position' ? '0' : '0') },
          { getAttribute: (n: string) => (n === 'position' ? '1000' : '0') },
        ];
      }
      if (xpath === '//elements/element') {
        return [
          {
            getAttribute: (n: string) =>
              n === 'x' || n === 'y'
                ? '0'
                : n === 'sx' || n === 'sy'
                  ? '10'
                  : n === 'page'
                    ? '0'
                    : '1',
          },
          {
            getAttribute: (n: string) =>
              n === 'x' || n === 'y'
                ? '100'
                : n === 'sx' || n === 'sy'
                  ? '10'
                  : '1',
          },
        ];
      }
      return [];
    }),
    transform: vi.fn(
      async (
        stylesheet: string,
        _source: string,
        _params: Record<string, any>,
      ) => {
        // Simulate error when stylesheet doesn't exist
        if (stylesheet === 'timemap.sef.json') {
          throw new Error('XError:No stylesheet supplied; code:SXJS0006');
        }
        return SAMPLE_TIMEMAP_JSON;
      },
    ),
  };
}

// Mock Verovio Toolkit surface used by our code paths
export function mockVerovioModule() {
  const mockToolkit = {
    setOptions: vi.fn(),
    loadData: vi.fn(() => true),
    renderToMIDI: vi.fn(() => btoa(String.fromCharCode(0, 1, 2, 3))),
    renderToTimemap: vi.fn(() => [
      { measureOn: 'm1', tstamp: 0 },
      { tstamp: 1000 },
    ]),
    redoLayout: vi.fn(),
    getPageCount: vi.fn(() => 1),
    renderToSVG: vi.fn(
      () =>
        '<svg width="100" height="100"><g class="system" id="system1"><g id="m1" class="measure"></g></g></svg>',
    ),
    getVersion: vi.fn(() => 'X.Y.Z'),
  } as any;
  const ctor = vi.fn(() => mockToolkit);
  return { mockToolkit, ctor };
}

// Mock OSMD minimal surface
export function mockOSMD() {
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
  return osmd;
}

// Global fetch mocking helpers
export function withGlobalFetch(
  mockImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  vi.stubGlobal('fetch', vi.fn(mockImpl) as any);
}

export function resetGlobals() {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
}

// Import CollectionUtil types defined by OpenSheetMusicDisplay
import type {} from 'opensheetmusicdisplay/build/dist/src/Util/CollectionUtil';

// Our implementation of CollectionUtil polyfills
export function installArrayPolyfills() {
  // Only add polyfills if they don't already exist
  if (!Array.prototype.last) {
    Array.prototype.last = function <T>(this: T[]): T {
      if (this.length === 0) {
        throw new Error('Cannot get last element of empty array');
      }
      return this[this.length - 1];
    };
  }

  if (!Array.prototype.clear) {
    Array.prototype.clear = function <T>(this: T[]): void {
      this.length = 0;
    };
  }

  if (!Array.prototype.contains) {
    Array.prototype.contains = function <T>(this: T[], elem: T): boolean {
      return this.indexOf(elem) !== -1;
    };
  }
}

// Optional DOM helpers for consistency
export function installDom() {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    resetGlobals();
  });
}
