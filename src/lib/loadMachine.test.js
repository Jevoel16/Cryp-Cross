import { describe, expect, it } from 'vitest';
import { LOAD, LOAD_EVENT, loadReducer, pendingLoad } from './loadMachine';

const pending = pendingLoad('2026-11-01');
const loaded = loadReducer(pending, { type: LOAD_EVENT.LOADED, data: { solvers: 3 } });
const failed = loadReducer(pending, { type: LOAD_EVENT.FAILED, error: 'Cannot reach the server.' });

describe('loadReducer', () => {
  it('pending -> loaded or failed, each with only its own data', () => {
    expect(pending).toEqual({ status: LOAD.PENDING, key: '2026-11-01' });
    expect(loaded).toEqual({ status: LOAD.LOADED, key: '2026-11-01', data: { solvers: 3 } });
    expect(failed).toEqual({ status: LOAD.FAILED, key: '2026-11-01', error: 'Cannot reach the server.' });
  });

  it('a new key starts over from any state', () => {
    const started = { type: LOAD_EVENT.STARTED, key: '2026-11-02' };
    expect(loadReducer(pending, started)).toEqual(pendingLoad('2026-11-02'));
    expect(loadReducer(loaded, started)).toEqual(pendingLoad('2026-11-02'));
    expect(loadReducer(failed, started)).toEqual(pendingLoad('2026-11-02'));
  });

  it('rejects a restart of the same key, a second result and unknown events', () => {
    const sameKey = { type: LOAD_EVENT.STARTED, key: '2026-11-01' };
    expect(loadReducer(pending, sameKey)).toBe(pending);
    expect(loadReducer(loaded, sameKey)).toBe(loaded);
    expect(loadReducer(loaded, { type: LOAD_EVENT.FAILED, error: 'late' })).toBe(loaded);
    expect(loadReducer(failed, { type: LOAD_EVENT.LOADED, data: {} })).toBe(failed);
    expect(loadReducer(pending, { type: 'nope' })).toBe(pending);
  });
});
