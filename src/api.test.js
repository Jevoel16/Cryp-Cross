import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, isAbort } from './api';

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe('api', () => {
  it('returns the data field of a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ success: true, data: { date: '2026-11-11' } })),
    );
    expect(await api('/puzzles/today')).toEqual({ date: '2026-11-11' });
  });

  it('throws the server message and status on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ success: false, message: 'Nope' }, 409)),
    );
    await expect(api('/x')).rejects.toMatchObject({ message: 'Nope', status: 409 });
  });

  it('turns a network failure into a readable ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    const error = await api('/x').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(isAbort(error)).toBe(false);
  });

  it('passes the signal to fetch and rethrows an abort untouched', async () => {
    const fetchMock = vi.fn(
      (url, { signal }) =>
        new Promise((resolve, reject) =>
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
        ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const pending = api('/leaderboard?date=2026-11-10', { signal: controller.signal }).catch((e) => e);
    controller.abort();
    const error = await pending;
    expect(isAbort(error)).toBe(true);
    expect(error).not.toBeInstanceOf(ApiError);
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
