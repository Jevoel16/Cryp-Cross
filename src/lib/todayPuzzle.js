import { api } from '../api';

// Short enough that a new day's puzzle shows up soon after it changes.
const MAX_AGE_MS = 60_000;
let cache = null;

// Today's puzzle, shared between Home and Play so moving between them doesn't refetch it.
export function fetchTodayPuzzle(now = Date.now()) {
  if (cache && now - cache.at < MAX_AGE_MS) return cache.promise;
  const entry = { at: now, promise: api('/puzzles/today') };
  // A failed request is not kept, so the next caller tries again.
  entry.promise.catch(() => {
    if (cache === entry) cache = null;
  });
  cache = entry;
  return entry.promise;
}

export function clearTodayPuzzle() {
  cache = null;
}
