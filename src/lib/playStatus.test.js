import { describe, expect, it } from 'vitest';
import { PLAY_STATUS, PROGRESS_EVENT, initialProgress, playStatus, progressReducer } from './playStatus';

const user = { username: 'alice' };
const loaded = { type: PROGRESS_EVENT.LOADED, progress: { grid: [] } };
const failed = { type: PROGRESS_EVENT.FAILED, error: 'Cannot reach the server.' };
const retry = { type: PROGRESS_EVENT.RETRY };

describe('progressReducer', () => {
  it('pending -> loaded keeps the progress', () => {
    const next = progressReducer(initialProgress, loaded);
    expect(next.progress).toEqual({ grid: [] });
    expect(next.error).toBe('');
  });

  it('pending -> failed keeps the error and no progress', () => {
    const next = progressReducer(initialProgress, failed);
    expect(next.error).toBe('Cannot reach the server.');
    expect(next.progress).toBeNull();
  });

  it('failed -> retry goes back to pending and counts the try', () => {
    const next = progressReducer(progressReducer(initialProgress, failed), retry);
    expect(next).toEqual({ ...initialProgress, tries: 1 });
  });

  it('rejects transitions that make no sense', () => {
    const done = progressReducer(initialProgress, loaded);
    expect(progressReducer(done, failed)).toBe(done);
    expect(progressReducer(done, retry)).toBe(done);
    expect(progressReducer(initialProgress, retry)).toBe(initialProgress);
    expect(progressReducer(initialProgress, { type: 'nope' })).toBe(initialProgress);
  });
});

describe('playStatus', () => {
  it('waits for the session before deciding', () => {
    expect(playStatus({ authLoading: true, user: null, request: initialProgress })).toBe(PLAY_STATUS.AUTH_LOADING);
  });

  it('is guest only when nobody is signed in', () => {
    expect(playStatus({ authLoading: false, user: null, request: initialProgress })).toBe(PLAY_STATUS.GUEST);
  });

  it('follows the progress request for a signed-in player', () => {
    expect(playStatus({ authLoading: false, user, request: initialProgress })).toBe(PLAY_STATUS.LOADING);
    expect(playStatus({ authLoading: false, user, request: progressReducer(initialProgress, loaded) })).toBe(
      PLAY_STATUS.READY,
    );
  });

  it('a failed load is an error, never guest mode', () => {
    const request = progressReducer(initialProgress, failed);
    expect(playStatus({ authLoading: false, user, request })).toBe(PLAY_STATUS.ERROR);
  });
});
