import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTodayPuzzle, fetchTodayPuzzle } from './todayPuzzle';

const ok = (data) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) });

beforeEach(() => clearTodayPuzzle());
afterEach(() => vi.unstubAllGlobals());

describe('fetchTodayPuzzle', () => {
  it('shares one request between callers within a minute', async () => {
    const fetchMock = vi.fn(async () => ok({ date: '2026-11-11' }));
    vi.stubGlobal('fetch', fetchMock);
    const [a, b] = await Promise.all([fetchTodayPuzzle(1000), fetchTodayPuzzle(2000)]);
    expect(a).toEqual({ date: '2026-11-11' });
    expect(b).toBe(a);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks again once the copy is older than a minute', async () => {
    const fetchMock = vi.fn(async () => ok({ date: '2026-11-11' }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchTodayPuzzle(0);
    await fetchTodayPuzzle(60_001);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not keep a failed request', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(ok({ date: '2026-11-11' }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchTodayPuzzle(0)).rejects.toThrow();
    await expect(fetchTodayPuzzle(1)).resolves.toEqual({ date: '2026-11-11' });
  });
});
