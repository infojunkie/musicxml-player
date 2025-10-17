import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resetGlobals, installArrayPolyfills } from '../helpers/test-utils';
import {
  MockAudioContext,
  MockAudioWorkletNode,
  MockResizeObserver,
  createMockAbortController,
  createMockRequestAnimationFrame,
  createMockURL,
  createMockRenderer,
  createMockConverter,
  createMockXsltProcessor,
  SAMPLE_MUSICXML,
} from '../mocks';

// Mock the SpessaSynth dependencies at the top level because vi hoisting
vi.mock('spessasynth_core', () => {
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
});

vi.mock('spessasynth_lib', () => {
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

  const mockSequencer = {
    connectMIDIOutput: vi.fn(),
    loadNewSongList: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    currentTime: 0,
    playbackRate: 1,
    loopCount: 1,
  };

  return {
    WorkletSynthesizer: MockWorkletSynthesizer,
    Sequencer: vi.fn(() => mockSequencer),
  };
});

// Mock the helper functions - use the same path as Player.ts
const mockParseMusicXml = vi.fn();
const mockUnrollMusicXml = vi.fn();
const mockFetish = vi.fn();
const mockDebounce = vi.fn();

vi.mock('../../helpers', async () => {
  const actual: any = await vi.importActual('../../helpers');
  return {
    ...actual,
    parseMusicXml: mockParseMusicXml,
    unrollMusicXml: mockUnrollMusicXml,
    fetish: mockFetish,
    debounce: mockDebounce,
  };
});

// Set up global mocks
vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('AudioWorkletNode', MockAudioWorkletNode);
vi.stubGlobal('URL', createMockURL());
vi.stubGlobal('ResizeObserver', MockResizeObserver);
vi.stubGlobal('AbortController', createMockAbortController());
vi.stubGlobal('requestAnimationFrame', createMockRequestAnimationFrame());

// Import Player after mocks are set up
// FIXME Should we have a IPlayer interface?
let Player: any;
let PlayerState: any;

describe('Player', () => {
  let mockRenderer: any;
  let mockConverter: any;
  let mockXsltProcessor: any;

  beforeEach(async () => {
    resetGlobals();
    installArrayPolyfills();

    // Import Player after mocks are set up
    vi.doMock('../../helpers', async () => {
      const actual: any = await vi.importActual('../../helpers');
      return {
        ...actual,
        parseMusicXml: mockParseMusicXml,
        unrollMusicXml: mockUnrollMusicXml,
        fetish: mockFetish,
        debounce: mockDebounce,
      };
    });

    // async factory method
    const playerModule = await import('../../Player');
    Player = playerModule.Player;
    PlayerState = playerModule.PlayerState;

    // Setup AudioContext mock
    // TODO make this mock more real world
    // @see https://github.com/chrisguttandin/standardized-audio-context-mock
    // but as per its documentation, it does depend on Sinon.JS to do the mocking.
    global.AudioContext = MockAudioContext as any;

    // Setup ResizeObserver mock
    // It seems that there are no better way to mock this,
    // I found no library that can mock ResizeObserver.
    global.ResizeObserver = MockResizeObserver as any;

    // Reset all mocks to ensure clean state
    vi.clearAllMocks();

    // Setup mocks for helper functions after clearing
    mockParseMusicXml.mockResolvedValue({
      musicXml: SAMPLE_MUSICXML,
      queries: {
        title: { result: 'Test Title' },
        version: { result: '3.1' },
      },
    });

    mockUnrollMusicXml.mockResolvedValue(SAMPLE_MUSICXML);
    mockFetish.mockImplementation(() =>
      Promise.resolve({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      }),
    );

    mockDebounce.mockImplementation((fn) => fn);

    // Create mocks using factory functions
    mockRenderer = createMockRenderer();
    mockConverter = createMockConverter();
    mockXsltProcessor = createMockXsltProcessor();

    // Setup DOM
    document.body.innerHTML = '<div id="test-container"></div>';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Player', () => {
    // test indirectly the constructor method through create()
    describe('create', () => {
      it('creates a player instance with all dependencies', async () => {
        const player = await Player.create({
          container: 'test-container',
          musicXml: SAMPLE_MUSICXML,
          renderer: mockRenderer,
          converter: mockConverter,
          xsltProcessor: mockXsltProcessor,
        });

        // TODO a better way would be to assert that no errors were thrown
        expect(mockConverter.initialize).toHaveBeenCalledWith(
          SAMPLE_MUSICXML,
          expect.any(Object),
        );
        expect(mockRenderer.initialize).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          SAMPLE_MUSICXML,
          expect.any(Object),
        );
        // Useless assertion
        expect(player).toBeInstanceOf(Player);
        expect(mockRenderer.player).toBe(player);
      });

      it('creates a player with string container ID', async () => {
        const player = await Player.create({
          container: 'test-container',
          musicXml: SAMPLE_MUSICXML,
          renderer: mockRenderer,
          converter: mockConverter,
        });

        expect(player).toBeInstanceOf(Player);
      });

      it('creates a player with HTMLElement container', async () => {
        const container = document.getElementById('test-container')!;
        const player = await Player.create({
          container,
          musicXml: SAMPLE_MUSICXML,
          renderer: mockRenderer,
          converter: mockConverter,
        });

        expect(player).toBeInstanceOf(Player);
      });

      it('throws error when container not found', async () => {
        await expect(
          Player.create({
            container: 'non-existent-container',
            musicXml: SAMPLE_MUSICXML,
            renderer: mockRenderer,
            converter: mockConverter,
          }),
        ).rejects.toThrow('[Player.load] Failed to find container element.');
      });

      it('uses default options when not provided', async () => {
        const player = await Player.create({
          container: 'test-container',
          musicXml: SAMPLE_MUSICXML,
          renderer: mockRenderer,
          converter: mockConverter,
        });

        expect(player).toBeInstanceOf(Player);
        expect(player.version).toHaveProperty('player');
        expect(player.version).toHaveProperty('renderer');
        expect(player.version).toHaveProperty('converter');
      });

      it('handles unroll option when enabled', async () => {
        const { unrollMusicXml } = await import('../../helpers');

        await Player.create({
          container: 'test-container',
          musicXml: SAMPLE_MUSICXML,
          renderer: mockRenderer,
          converter: mockConverter,
          unroll: true,
        });

        expect(unrollMusicXml).toHaveBeenCalled();
      });

      it('handles converter initialization failure', async () => {
        mockConverter.initialize.mockRejectedValue(
          new Error('Converter init failed'),
        );

        await expect(
          Player.create({
            container: 'test-container',
            musicXml: SAMPLE_MUSICXML,
            renderer: mockRenderer,
            converter: mockConverter,
          }),
        ).rejects.toThrow('Converter init failed');
      });

      it('handles renderer initialization failure', async () => {
        mockRenderer.initialize.mockRejectedValue(
          new Error('Renderer init failed'),
        );

        await expect(
          Player.create({
            container: 'test-container',
            musicXml: SAMPLE_MUSICXML,
            renderer: mockRenderer,
            converter: mockConverter,
          }),
        ).rejects.toThrow('Renderer init failed');
      });
    });
  });

  describe('Player instance methods', () => {
    let player: typeof Player;

    beforeEach(async () => {
      player = await Player.create({
        container: 'test-container',
        musicXml: SAMPLE_MUSICXML,
        renderer: mockRenderer,
        converter: mockConverter,
      });
    });

    describe('properties', () => {
      it('exposes musicXml property', () => {
        expect(player.musicXml).toBe(SAMPLE_MUSICXML);
      });

      it('exposes midi property', () => {
        expect(player.midi).toBeInstanceOf(ArrayBuffer);
      });

      it('exposes state property', () => {
        expect(player.state).toBe(PlayerState.Stopped);
      });

      it('exposes title property', () => {
        expect(player.title).toBe('Test Title');
      });

      it('exposes duration property', () => {
        expect(player.duration).toBe(1000); // 1.0 * 1000
      });

      it('exposes position property', () => {
        expect(player.position).toBe(0);
      });

      it('exposes version property', () => {
        expect(player.version).toEqual({
          player: expect.stringContaining('musicxml-player'),
          renderer: 'MockRenderer v1.0.0',
          converter: 'MockConverter v1.0.0',
          sequencer: expect.stringContaining('spessasynth_lib'),
        });
      });
    });

    describe('playback control', () => {
      it('starts playback', () => {
        // Test that play doesn't throw
        expect(() => player.play()).not.toThrow();
      });

      it('pauses playback', () => {
        // Test that pause doesn't throw
        expect(() => player.pause()).not.toThrow();
      });

      it('rewinds to start', () => {
        player.rewind();

        expect(mockRenderer.moveTo).toHaveBeenCalledWith(0, 0, 0);
      });
    });

    describe('moveTo method', () => {
      it('moves to specified position', () => {
        player.moveTo(1, 1000, 500);

        expect(mockRenderer.moveTo).toHaveBeenCalledWith(1, 1000, 500);
      });

      it('handles moveTo with no matching timemap entry', () => {
        // Test that moveTo throws when there are no matching timemap entries
        // The current timemap has entries for measures 0 and 1, so measure 999 should not match
        expect(() => player.moveTo(999, 1000, 500)).toThrow(
          'Cannot get last element of empty array',
        );
      });
    });

    describe('setters', () => {
      it('sets repeat count', () => {
        // Test that the setter doesn't throw
        expect(() => {
          player.repeat = 5;
        }).not.toThrow();
      });

      it('sets mute state', () => {
        // Test that the setter doesn't throw
        expect(() => {
          player.mute = true;
        }).not.toThrow();
      });

      it('sets velocity', () => {
        // Test that the setter doesn't throw
        expect(() => {
          player.velocity = 1.5;
        }).not.toThrow();
      });

      it('sets MIDI output', () => {
        const mockOutput = {} as WebMidi.MIDIOutput;

        // Test that the setter doesn't throw
        expect(() => {
          player.output = mockOutput;
        }).not.toThrow();
      });
    });

    describe('destroy method', () => {
      it('cleans up all resources', () => {
        player.destroy();

        expect(mockRenderer.destroy).toHaveBeenCalled();
        // The actual sequencer is created inside the player, so we can't easily test the mock
        // But we can test that destroy doesn't throw
      });

      it('handles cleanup errors gracefully', () => {
        mockRenderer.destroy.mockImplementation(() => {
          throw new Error('Cleanup error');
        });

        // Should not throw
        expect(() => player.destroy()).not.toThrow();
      });
    });

    describe('snapshots', () => {
      it('snapshots player creation and basic properties', async () => {
        const player = await Player.create({
          container: 'test-container',
          musicXml: SAMPLE_MUSICXML,
          renderer: mockRenderer,
          converter: mockConverter,
        });

        expect({
          musicXml: player.musicXml,
          state: player.state,
          title: player.title,
          duration: player.duration,
          position: player.position,
          version: player.version,
        }).toMatchSnapshot();
      });

      it('snapshots player after playback operations', async () => {
        const player = await Player.create({
          container: 'test-container',
          musicXml: SAMPLE_MUSICXML,
          renderer: mockRenderer,
          converter: mockConverter,
        });

        player.play();
        player.pause();
        player.moveTo(1, 1000, 500);
        player.rewind();

        expect({
          state: player.state,
          position: player.position,
          rendererCalls: mockRenderer.moveTo.mock.calls,
        }).toMatchSnapshot();
      });
    });
  });
});
