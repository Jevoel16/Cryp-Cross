const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  AUTH_VIA,
  SESSION_AUTH,
  RECENT_OAUTH_MS,
  sessionAuthStatus,
  canSetPasswordWithoutCurrent,
  signIn,
  signOut,
} = require('../lib/sessionAuth');

describe('session auth status', () => {
  const now = 1_000_000;

  test('anonymous without a user', () => {
    assert.equal(sessionAuthStatus(undefined, now), SESSION_AUTH.ANONYMOUS);
    assert.equal(sessionAuthStatus({}, now), SESSION_AUTH.ANONYMOUS);
    assert.equal(sessionAuthStatus({ authVia: AUTH_VIA.OAUTH, authAt: now }, now), SESSION_AUTH.ANONYMOUS);
  });

  test('password and OAuth sign-ins, and the 10 minute window', () => {
    const session = {};
    signIn(session, 'u1', AUTH_VIA.PASSWORD, now);
    assert.equal(sessionAuthStatus(session, now), SESSION_AUTH.PASSWORD);
    assert.equal(canSetPasswordWithoutCurrent(session, now), false);

    signIn(session, 'u1', AUTH_VIA.OAUTH, now);
    assert.equal(sessionAuthStatus(session, now + RECENT_OAUTH_MS), SESSION_AUTH.OAUTH_FRESH);
    assert.equal(canSetPasswordWithoutCurrent(session, now + RECENT_OAUTH_MS), true);
    assert.equal(sessionAuthStatus(session, now + RECENT_OAUTH_MS + 1), SESSION_AUTH.OAUTH_EXPIRED);
    assert.equal(canSetPasswordWithoutCurrent(session, now + RECENT_OAUTH_MS + 1), false);
  });

  test('saving a password closes the OAuth window', () => {
    const session = {};
    signIn(session, 'u1', AUTH_VIA.OAUTH, now);
    signIn(session, 'u1', AUTH_VIA.PASSWORD, now + 5);
    assert.equal(sessionAuthStatus(session, now + 6), SESSION_AUTH.PASSWORD);
  });

  test('sign out clears every field together', () => {
    const session = {};
    signIn(session, 'u1', AUTH_VIA.OAUTH, now);
    signOut(session);
    assert.deepEqual(session, { userId: undefined, authAt: undefined, authVia: undefined });
    assert.equal(sessionAuthStatus(session, now), SESSION_AUTH.ANONYMOUS);
  });

  test('an unknown sign-in method is rejected', () => {
    assert.throws(() => signIn({}, 'u1', 'magic-link'), /Unknown sign-in method/);
  });
});
