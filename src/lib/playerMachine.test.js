import { describe, expect, it } from 'vitest';
import { GUEST_CLOCK, PHASE, PLAYER_EVENT, guestClockStatus, initialPlayerState, playerReducer } from './playerMachine';

const fresh = () => initialPlayerState({ progress: { startedAt: '2026-11-11T00:00:00Z' }, guestClock: null });
const requesting = () => playerReducer(fresh(), { type: PLAYER_EVENT.REQUEST });

describe('guestClockStatus', () => {
  it('reads the stored clock', () => {
    expect(guestClockStatus(null)).toBe(GUEST_CLOCK.NONE);
    expect(guestClockStatus({ startedAt: 'x' })).toBe(GUEST_CLOCK.NONE);
    expect(guestClockStatus({ startedAt: 5 })).toBe(GUEST_CLOCK.RUNNING);
    expect(guestClockStatus({ startedAt: 5, timeMs: 900 })).toBe(GUEST_CLOCK.SOLVED);
    expect(guestClockStatus({ startedAt: 5, timeMs: null })).toBe(GUEST_CLOCK.SOLVED);
  });
});

describe('initialPlayerState', () => {
  it('starts in playing with nothing to show', () => {
    expect(fresh()).toMatchObject({ phase: PHASE.PLAYING, result: null, feedback: null, saveError: '' });
  });

  it('starts solved for a solved server attempt', () => {
    const state = initialPlayerState({ progress: { solvedAt: 'x', timeMs: 4200 }, guestClock: null });
    expect(state).toMatchObject({ phase: PHASE.SOLVED, result: { timeMs: 4200, guest: false } });
  });

  it('starts solved for a finished guest clock, but only for guests', () => {
    const clock = { startedAt: 1, timeMs: 900 };
    expect(initialPlayerState({ progress: null, guestClock: clock }).result).toEqual({ timeMs: 900, guest: true });
    expect(initialPlayerState({ progress: { startedAt: 'x' }, guestClock: clock }).phase).toBe(PHASE.PLAYING);
  });
});

describe('playerReducer', () => {
  it('playing -> requesting clears old feedback', () => {
    const withFeedback = { ...fresh(), feedback: { type: 'error', text: 'old' } };
    expect(playerReducer(withFeedback, { type: PLAYER_EVENT.REQUEST })).toMatchObject({
      phase: PHASE.REQUESTING,
      feedback: null,
    });
  });

  it('requesting -> playing on a check, with marks and a summary', () => {
    const next = playerReducer(requesting(), {
      type: PLAYER_EVENT.CHECKED,
      rowsKey: 'AB|C ',
      entries: ['right', 'wrong', 'incomplete'],
    });
    expect(next.phase).toBe(PHASE.PLAYING);
    expect(next.checked).toEqual({ rowsKey: 'AB|C ', status: { 0: 'right', 1: 'wrong', 2: 'incomplete' } });
    expect(next.feedback).toEqual({ type: 'error', text: '1 right, 1 wrong, 1 unfinished.' });
  });

  it('requesting -> playing when the submit is not solved or fails', () => {
    expect(playerReducer(requesting(), { type: PLAYER_EVENT.NOT_SOLVED, wrong: 2, incomplete: 1 }).feedback.text).toBe(
      'Not quite: 2 wrong and 1 unfinished. Use Check to find them.',
    );
    const failed = playerReducer(requesting(), { type: PLAYER_EVENT.FAILED, error: 'Cannot reach the server.' });
    expect(failed).toMatchObject({
      phase: PHASE.PLAYING,
      feedback: { type: 'error', text: 'Cannot reach the server.' },
    });
  });

  it('requesting -> solved keeps only the result', () => {
    const next = playerReducer(
      { ...requesting(), saveError: 'offline' },
      { type: PLAYER_EVENT.SOLVED, result: { timeMs: 5000, rank: 2, guest: false } },
    );
    expect(next).toMatchObject({
      phase: PHASE.SOLVED,
      result: { timeMs: 5000, rank: 2 },
      feedback: null,
      saveError: '',
    });
  });

  it('keeps save errors apart from check feedback', () => {
    const unsaved = playerReducer(fresh(), { type: PLAYER_EVENT.SAVE_FAILED, error: 'Cannot reach the server.' });
    expect(unsaved.saveError).toBe('Cannot reach the server.');
    const checking = playerReducer(unsaved, { type: PLAYER_EVENT.REQUEST });
    expect(checking.saveError).toBe('Cannot reach the server.');
    expect(playerReducer(checking, { type: PLAYER_EVENT.SAVED }).saveError).toBe('');
  });

  it('rejects results that arrive outside a request', () => {
    const state = fresh();
    expect(playerReducer(state, { type: PLAYER_EVENT.SOLVED, result: { timeMs: 1 } })).toBe(state);
    expect(playerReducer(state, { type: PLAYER_EVENT.CHECKED, rowsKey: 'x', entries: [] })).toBe(state);
    expect(playerReducer(requesting(), { type: PLAYER_EVENT.REQUEST }).phase).toBe(PHASE.REQUESTING);
  });

  it('solved is final', () => {
    const solved = initialPlayerState({ progress: { solvedAt: 'x', timeMs: 1 }, guestClock: null });
    for (const type of Object.values(PLAYER_EVENT)) {
      expect(playerReducer(solved, { type, error: 'e', entries: [], result: {} })).toBe(solved);
    }
  });
});
