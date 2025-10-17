import { describe, it, expect, vi } from 'vitest';
import { VerovioConverter } from '../../VerovioConverter';

// Mock the verovio modules to prevent import errors
vi.mock('verovio/wasm', () => ({ default: vi.fn(async () => ({})) }));
vi.mock('verovio/esm', () => ({
  VerovioToolkit: vi.fn(() => ({
    setOptions: vi.fn(),
    loadData: vi.fn(() => true),
    renderToMIDI: vi.fn(() => btoa('MIDI data')),
    renderToTimemap: vi.fn(() => []),
    redoLayout: vi.fn(),
    getPageCount: vi.fn(() => 1),
    renderToSVG: vi.fn(() => '<svg></svg>'),
    getVersion: vi.fn(() => 'X.Y.Z'),
  })),
}));

describe('VerovioConverter', () => {
  it('can be instantiated', () => {
    const conv = new VerovioConverter();
    expect(conv).toBeDefined();
    expect(conv).toBeInstanceOf(VerovioConverter);
    // Check that timemap is an array (even if empty initially)
    expect(conv.version).toBeDefined();
    expect(typeof conv.version).toBe('string');
    expect(conv.version.length).toBeGreaterThan(0);
    expect(Array.isArray(conv.timemap)).toBe(true);
  });
});
