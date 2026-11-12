const storageKey = (date) => `cc:grid:${date}`;
const guestKey = (date) => `cc:guest:${date}`;

// Per-browser draft of the grid, so a refresh doesn't lose typed letters.
export function readDraft(date) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(date)));
  } catch {
    return null;
  }
}

export function writeDraft(date, rows) {
  try {
    localStorage.setItem(storageKey(date), JSON.stringify(rows));
  } catch {
    // Storage blocked: the draft just won't survive a refresh.
  }
}

// Guest solves are timed in this browser only; they never reach the server.
export function readGuestClock(date) {
  try {
    const saved = JSON.parse(localStorage.getItem(guestKey(date)));
    return saved && Number.isFinite(saved.startedAt) ? saved : null;
  } catch {
    return null;
  }
}

export function writeGuestClock(date, clock) {
  try {
    localStorage.setItem(guestKey(date), JSON.stringify(clock));
  } catch {
    // Storage blocked: the guest timer restarts on refresh.
  }
}
