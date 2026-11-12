import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readDraft, readGuestClock, writeDraft, writeGuestClock } from './playStorage';

const DAY = '2026-11-12';
let store;

beforeEach(() => {
  store = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('grid draft', () => {
  it('reads back what was written, per day', () => {
    writeDraft(DAY, ['CAT', '  O']);
    expect(readDraft(DAY)).toEqual(['CAT', '  O']);
    expect(readDraft('2026-11-13')).toBeNull();
  });

  it('returns null for a corrupted draft', () => {
    store.set(`cc:grid:${DAY}`, '{not json');
    expect(readDraft(DAY)).toBeNull();
  });
});

describe('guest clock', () => {
  it('reads back a clock with a start time', () => {
    writeGuestClock(DAY, { startedAt: 1000, timeMs: 500 });
    expect(readGuestClock(DAY)).toEqual({ startedAt: 1000, timeMs: 500 });
  });

  it('rejects a clock without a numeric start time', () => {
    store.set(`cc:guest:${DAY}`, JSON.stringify({ startedAt: 'soon' }));
    expect(readGuestClock(DAY)).toBeNull();
  });
});

it('blocked storage neither throws nor returns data', () => {
  const blocked = () => {
    throw new Error('blocked');
  };
  vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked });
  expect(() => writeDraft(DAY, ['CAT'])).not.toThrow();
  expect(() => writeGuestClock(DAY, { startedAt: 1 })).not.toThrow();
  expect(readDraft(DAY)).toBeNull();
  expect(readGuestClock(DAY)).toBeNull();
});
