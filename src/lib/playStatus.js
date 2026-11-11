// Who is playing today's puzzle, as one status (see docs/state-machines.md#today-page).
export const PLAY_STATUS = Object.freeze({
  AUTH_LOADING: 'authLoading',
  GUEST: 'guest',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
});

export const PROGRESS_EVENT = Object.freeze({ LOADED: 'loaded', FAILED: 'failed', RETRY: 'retry' });

const REQUEST = Object.freeze({ PENDING: 'pending', LOADED: 'loaded', FAILED: 'failed' });

export const initialProgress = Object.freeze({ request: REQUEST.PENDING, tries: 0, progress: null, error: '' });

// The only place the progress request changes state; unknown pairs keep the current state.
export function progressReducer(state, event) {
  if (state.request === REQUEST.PENDING && event.type === PROGRESS_EVENT.LOADED) {
    return { ...state, request: REQUEST.LOADED, progress: event.progress, error: '' };
  }
  if (state.request === REQUEST.PENDING && event.type === PROGRESS_EVENT.FAILED) {
    return { ...state, request: REQUEST.FAILED, progress: null, error: event.error };
  }
  if (state.request === REQUEST.FAILED && event.type === PROGRESS_EVENT.RETRY) {
    return { request: REQUEST.PENDING, tries: state.tries + 1, progress: null, error: '' };
  }
  return state;
}

// A signed-in player whose progress failed to load is never treated as a guest.
export function playStatus({ authLoading, user, request }) {
  if (authLoading) return PLAY_STATUS.AUTH_LOADING;
  if (!user) return PLAY_STATUS.GUEST;
  if (request.request === REQUEST.LOADED) return PLAY_STATUS.READY;
  if (request.request === REQUEST.FAILED) return PLAY_STATUS.ERROR;
  return PLAY_STATUS.LOADING;
}
