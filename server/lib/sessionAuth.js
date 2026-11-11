// How the current session proved who the player is (see docs/state-machines.md#session-auth).
const AUTH_VIA = Object.freeze({ PASSWORD: 'password', OAUTH: 'oauth' });
const SESSION_AUTH = Object.freeze({
  ANONYMOUS: 'anonymous',
  PASSWORD: 'password',
  OAUTH_FRESH: 'oauthFresh',
  OAUTH_EXPIRED: 'oauthExpired',
});

// A GitHub/Google sign-in this recent can set a new password without the current one.
const RECENT_OAUTH_MS = 10 * 60 * 1000;

function sessionAuthStatus(session, now = Date.now()) {
  if (!session || !session.userId) return SESSION_AUTH.ANONYMOUS;
  if (session.authVia !== AUTH_VIA.OAUTH) return SESSION_AUTH.PASSWORD;
  return now - session.authAt <= RECENT_OAUTH_MS ? SESSION_AUTH.OAUTH_FRESH : SESSION_AUTH.OAUTH_EXPIRED;
}

const canSetPasswordWithoutCurrent = (session, now) => sessionAuthStatus(session, now) === SESSION_AUTH.OAUTH_FRESH;

// The three fields always change together, so a session is never half signed in.
function signIn(session, userId, via, at = Date.now()) {
  if (!Object.values(AUTH_VIA).includes(via)) throw new Error(`Unknown sign-in method: ${via}`);
  session.userId = String(userId);
  session.authAt = at;
  session.authVia = via;
}

function signOut(session) {
  session.userId = undefined;
  session.authAt = undefined;
  session.authVia = undefined;
}

module.exports = {
  AUTH_VIA,
  SESSION_AUTH,
  RECENT_OAUTH_MS,
  sessionAuthStatus,
  canSetPasswordWithoutCurrent,
  signIn,
  signOut,
};
