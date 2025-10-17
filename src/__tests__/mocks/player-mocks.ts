import { vi } from 'vitest';

// Mock AudioContext and related APIs
export const createMockAudioContext = () => ({
  resume: vi.fn().mockResolvedValue(undefined),
  destination: {},
  audioWorklet: {
    addModule: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock AudioContext constructor
export class MockAudioContext {
  resume = vi.fn().mockResolvedValue(undefined);
  destination = {};
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  baseLatency = 0;
  outputLatency = 0;

  // Add methods that might be called
  createGain = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: { value: 1 },
  });

  createOscillator = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440 },
  });
}

// Mock AudioWorkletNode
export class MockAudioWorkletNode {
  connect = vi.fn();
  disconnect = vi.fn();
  port = {
    postMessage: vi.fn(),
    onmessage: null,
  };
  context: AudioContext;
  numberOfInputs = 0;
  numberOfOutputs = 1;
  channelCount = 1;
  channelCountMode = 'max' as ChannelCountMode;
  channelInterpretation = 'speakers' as ChannelInterpretation;

  constructor(
    context: AudioContext,
    _name: string,
    _options?: AudioWorkletNodeOptions,
  ) {
    this.context = context;
    // Mock the constructor behavior - don't throw any errors
  }

  // Add any missing methods that might be called
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
}

// Mock ResizeObserver
export class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
}

// Mock AbortController
export const createMockAbortController = () =>
  vi.fn().mockImplementation(() => ({
    abort: vi.fn(),
    signal: {},
  }));

// Mock requestAnimationFrame
export const createMockRequestAnimationFrame = () =>
  vi.fn((callback: FrameRequestCallback) => {
    setTimeout(callback, 16); // Simulate 60fps
    return 1;
  });

// Mock URL
export const createMockURL = () =>
  vi.fn().mockImplementation(() => ({
    createObjectURL: vi.fn(() => 'blob:mock-url'),
  }));

// Mock SpessaSynth Core
export const createMockBasicMIDI = () => {
  const mockBasicMIDI = {
    writeMIDI: vi.fn(() => new ArrayBuffer(4)),
    duration: 1.0,
    tempoChanges: [{ tempo: 120 }],
    timeDivision: 480,
    tracks: [
      {
        pushEvent: vi.fn(),
      },
    ],
    flush: vi.fn(),
  };

  return {
    BasicMIDI: Object.assign(
      vi.fn(() => mockBasicMIDI),
      {
        fromArrayBuffer: vi.fn(() => mockBasicMIDI),
      },
    ),
    midiMessageTypes: {
      controllerChange: 0xb0,
    },
  };
};

// Mock SpessaSynth Lib
export const createMockSpessaSynthLib = () => {
  const mockSequencer = {
    connectMIDIOutput: vi.fn(),
    loadNewSongList: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    currentTime: 0,
    playbackRate: 1,
    loopCount: 1,
  };

  // Mock WorkletSynthesizer as a proper constructor
  class MockWorkletSynthesizer {
    connect = vi.fn();
    soundBankManager = {
      addSoundBank: vi.fn().mockResolvedValue(undefined),
    };
    channelsAmount = 16;
    muteChannel = vi.fn();

    constructor(_context: AudioContext) {
      // Mock constructor - don't try to create real AudioWorkletNode
      // The context parameter is ignored in the mock
    }
  }

  return {
    WorkletSynthesizer: MockWorkletSynthesizer,
    Sequencer: vi.fn(() => mockSequencer),
  };
};

// Mock Renderer
export const createMockRenderer = (overrides = {}) => ({
  player: undefined,
  destroy: vi.fn(),
  initialize: vi.fn().mockResolvedValue(undefined),
  moveTo: vi.fn(),
  onResize: vi.fn(),
  onEvent: vi.fn(),
  get version() {
    return 'MockRenderer v1.0.0';
  },
  ...overrides,
});

// Mock Converter
export const createMockConverter = (overrides = {}) => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  get midi() {
    return new ArrayBuffer(4);
  },
  get timemap() {
    return [
      { measure: 0, timestamp: 0, duration: 1000 },
      { measure: 1, timestamp: 1000, duration: 1000 },
    ];
  },
  get version() {
    return 'MockConverter v1.0.0';
  },
  ...overrides,
});

// Mock XSLT Processor
export const createMockXsltProcessor = () => ({
  parse: vi.fn().mockResolvedValue({ __doc: 'mock-doc' }),
  query: vi.fn().mockReturnValue([]),
  transform: vi.fn().mockResolvedValue('{}'),
});

// Mock Helper Functions
export const createMockHelpers = () => ({
  parseMusicXml: vi.fn(),
  unrollMusicXml: vi.fn(),
  fetish: vi.fn(),
  binarySearch: vi.fn(),
  debounce: vi.fn(),
});

// Sample MusicXML for testing
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
