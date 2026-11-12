import { useEffect, useReducer } from 'react';
import { LOAD_EVENT, loadReducer, pendingLoad } from '../lib/loadMachine';

// Loads `fetcher(key, signal)` when the page opens or `key` changes; pass a stable function.
export default function useLoad(fetcher, key = '') {
  const [state, dispatch] = useReducer(loadReducer, key, pendingLoad);

  useEffect(() => {
    const controller = new AbortController();
    // Cleared on cleanup so a request the player has left never reports back.
    let current = true;
    dispatch({ type: LOAD_EVENT.STARTED, key });
    fetcher(key, controller.signal).then(
      (data) => current && dispatch({ type: LOAD_EVENT.LOADED, data }),
      (error) => current && dispatch({ type: LOAD_EVENT.FAILED, error: error.message }),
    );
    return () => {
      current = false;
      controller.abort();
    };
  }, [fetcher, key]);

  // The effect runs after render, so a new key reads as pending straight away.
  return state.key === key ? state : pendingLoad(key);
}
