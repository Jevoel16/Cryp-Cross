// One submit flow shared by every form (see docs/state-machines.md#form-submit).
export const SUBMIT = Object.freeze({ IDLE: 'idle', SUBMITTING: 'submitting', SUCCESS: 'success', ERROR: 'error' });
export const SUBMIT_EVENT = Object.freeze({
  SUBMIT: 'submit',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  RESET: 'reset',
});

export const idleSubmit = Object.freeze({ status: SUBMIT.IDLE, message: '' });

export function submitReducer(state, event) {
  const submitting = state.status === SUBMIT.SUBMITTING;
  switch (event.type) {
    // A second submit while one is in flight is ignored.
    case SUBMIT_EVENT.SUBMIT:
      return submitting ? state : { status: SUBMIT.SUBMITTING, message: '' };
    case SUBMIT_EVENT.SUCCEEDED:
      return submitting ? { status: SUBMIT.SUCCESS, message: event.message || '' } : state;
    case SUBMIT_EVENT.FAILED:
      return submitting ? { status: SUBMIT.ERROR, message: event.message } : state;
    case SUBMIT_EVENT.RESET:
      return submitting ? state : idleSubmit;
    default:
      return state;
  }
}

// Shape FormMessage expects, or null when there is nothing to say.
export function submitMessage({ status, message }) {
  if (!message || (status !== SUBMIT.SUCCESS && status !== SUBMIT.ERROR)) return null;
  return { type: status, text: message };
}
