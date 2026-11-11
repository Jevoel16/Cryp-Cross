import { useCallback, useReducer } from 'react';
import { SUBMIT, SUBMIT_EVENT, idleSubmit, submitMessage, submitReducer } from '../lib/submitMachine';

// Runs one async action at a time and reports its result as a FormMessage.
export default function useSubmitState(initial = idleSubmit) {
  const [state, dispatch] = useReducer(submitReducer, initial);

  // `action` returns the success text (or nothing); resolves to the error when it fails, else null.
  const run = useCallback(async (action) => {
    dispatch({ type: SUBMIT_EVENT.SUBMIT });
    try {
      dispatch({ type: SUBMIT_EVENT.SUCCEEDED, message: await action() });
      return null;
    } catch (error) {
      dispatch({ type: SUBMIT_EVENT.FAILED, message: error.message });
      return error;
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: SUBMIT_EVENT.RESET }), []);

  return { status: state.status, busy: state.status === SUBMIT.SUBMITTING, message: submitMessage(state), run, reset };
}
