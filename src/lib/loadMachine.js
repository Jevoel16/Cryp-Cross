// One fetch-on-open flow shared by every page (see docs/state-machines.md#page-load).
export const LOAD = Object.freeze({ PENDING: 'pending', LOADED: 'loaded', FAILED: 'failed' });
export const LOAD_EVENT = Object.freeze({ STARTED: 'started', LOADED: 'loaded', FAILED: 'failed' });

// `key` names what is being loaded (a date, or '' when there is only one thing).
export const pendingLoad = (key) => ({ status: LOAD.PENDING, key });

export function loadReducer(state, event) {
  const pending = state.status === LOAD.PENDING;
  switch (event.type) {
    // Starting the load already shown is ignored; a new key starts over.
    case LOAD_EVENT.STARTED:
      return event.key === state.key ? state : pendingLoad(event.key);
    case LOAD_EVENT.LOADED:
      return pending ? { status: LOAD.LOADED, key: state.key, data: event.data } : state;
    case LOAD_EVENT.FAILED:
      return pending ? { status: LOAD.FAILED, key: state.key, error: event.error } : state;
    default:
      return state;
  }
}
