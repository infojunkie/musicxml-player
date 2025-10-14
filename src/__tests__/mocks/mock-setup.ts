import { vi } from 'vitest';
import { createMockBasicMIDI, createMockSpessaSynthLib } from './player-mocks';

// Mock the SpessaSynth dependencies
const spessaSynthCoreMock = createMockBasicMIDI();
const spessaSynthLibMock = createMockSpessaSynthLib();

vi.mock('spessasynth_core', () => spessaSynthCoreMock);
vi.mock('spessasynth_lib', () => spessaSynthLibMock);

// Mock any helper function that is built on an external library
vi.mock('../../helpers', () => ({
  parseMusicXml: vi.fn(),
  unrollMusicXml: vi.fn(),
  fetish: vi.fn(),
}));

export { spessaSynthCoreMock, spessaSynthLibMock };
