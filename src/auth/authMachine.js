// The browser's view of the session as one machine (see docs/state-machines.md#auth-session).
export const AUTH_STATUS = Object.freeze({
  LOADING: 'loading',
  SIGNED_IN: 'signedIn',
  SIGNED_OUT: 'signedOut',
  ERROR: 'error',
});

export const AUTH_EVENT = Object.freeze({
  LOADED: 'loaded',
  FAILED: 'failed',
  REFRESHED: 'refreshed',
  SET_USER: 'setUser',
  LOGGED_OUT: 'loggedOut',
});

export const initialAuth = Object.freeze({ status: AUTH_STATUS.LOADING, user: null, error: '' });

const withUser = (user) =>
  user ? { status: AUTH_STATUS.SIGNED_IN, user, error: '' } : { status: AUTH_STATUS.SIGNED_OUT, user: null, error: '' };

export function authReducer(state, event) {
  switch (event.type) {
    // The first /me answer only counts while still loading, so it can't undo a faster login.
    case AUTH_EVENT.LOADED:
      return state.status === AUTH_STATUS.LOADING ? withUser(event.user) : state;
    case AUTH_EVENT.FAILED:
      return state.status === AUTH_STATUS.LOADING
        ? { status: AUTH_STATUS.ERROR, user: null, error: event.error }
        : state;
    case AUTH_EVENT.REFRESHED:
      return withUser(event.user);
    case AUTH_EVENT.SET_USER:
      return withUser(typeof event.next === 'function' ? event.next(state.user) : event.next);
    case AUTH_EVENT.LOGGED_OUT:
      return withUser(null);
    default:
      return state;
  }
}
