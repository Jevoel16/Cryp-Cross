import { describe, expect, it } from 'vitest';
import { AUTH_EVENT, AUTH_STATUS, authReducer, initialAuth } from './authMachine';

const alice = { username: 'alice' };
const signedIn = authReducer(initialAuth, { type: AUTH_EVENT.LOADED, user: alice });

describe('authReducer', () => {
  it('loading -> signed in or signed out from the first /me answer', () => {
    expect(signedIn).toEqual({ status: AUTH_STATUS.SIGNED_IN, user: alice, error: '' });
    expect(authReducer(initialAuth, { type: AUTH_EVENT.LOADED, user: null }).status).toBe(AUTH_STATUS.SIGNED_OUT);
  });

  it('loading -> error when /me fails, which is not the same as signed out', () => {
    const failed = authReducer(initialAuth, { type: AUTH_EVENT.FAILED, error: 'Cannot reach the server.' });
    expect(failed).toEqual({ status: AUTH_STATUS.ERROR, user: null, error: 'Cannot reach the server.' });
  });

  it('a late first answer cannot undo a login that already happened', () => {
    const loggedIn = authReducer(initialAuth, { type: AUTH_EVENT.SET_USER, next: alice });
    expect(authReducer(loggedIn, { type: AUTH_EVENT.LOADED, user: null })).toBe(loggedIn);
    expect(authReducer(loggedIn, { type: AUTH_EVENT.FAILED, error: 'x' })).toBe(loggedIn);
  });

  it('setUser accepts a value or an updater and keeps the status in step', () => {
    const renamed = authReducer(signedIn, { type: AUTH_EVENT.SET_USER, next: (u) => ({ ...u, username: 'al' }) });
    expect(renamed).toMatchObject({ status: AUTH_STATUS.SIGNED_IN, user: { username: 'al' } });
    expect(authReducer(signedIn, { type: AUTH_EVENT.SET_USER, next: null }).status).toBe(AUTH_STATUS.SIGNED_OUT);
  });

  it('refresh and logout always apply', () => {
    expect(authReducer(signedIn, { type: AUTH_EVENT.REFRESHED, user: null }).status).toBe(AUTH_STATUS.SIGNED_OUT);
    const errored = authReducer(initialAuth, { type: AUTH_EVENT.FAILED, error: 'x' });
    expect(authReducer(errored, { type: AUTH_EVENT.REFRESHED, user: alice }).status).toBe(AUTH_STATUS.SIGNED_IN);
    expect(authReducer(signedIn, { type: AUTH_EVENT.LOGGED_OUT })).toEqual({
      status: AUTH_STATUS.SIGNED_OUT,
      user: null,
      error: '',
    });
  });

  it('ignores unknown events', () => {
    expect(authReducer(signedIn, { type: 'nope' })).toBe(signedIn);
  });
});
