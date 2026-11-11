// Check/Submit flow of the puzzle player as one machine (see docs/state-machines.md#puzzle-player).
export const PHASE = Object.freeze({ PLAYING: 'playing', REQUESTING: 'requesting', SOLVED: 'solved' });

export const PLAYER_EVENT = Object.freeze({
  REQUEST: 'request',
  CHECKED: 'checked',
  NOT_SOLVED: 'notSolved',
  FAILED: 'failed',
  SOLVED: 'solved',
  SAVE_FAILED: 'saveFailed',
  SAVED: 'saved',
});

export const GUEST_CLOCK = Object.freeze({ NONE: 'none', RUNNING: 'running', SOLVED: 'solved' });

const NO_CHECK = Object.freeze({ rowsKey: null, status: Object.freeze({}) });

// Reads the stored guest clock without changing its localStorage shape.
export function guestClockStatus(clock) {
  if (!clock || !Number.isFinite(clock.startedAt)) return GUEST_CLOCK.NONE;
  return 'timeMs' in clock ? GUEST_CLOCK.SOLVED : GUEST_CLOCK.RUNNING;
}

const playing = (extra = {}) => ({
  phase: PHASE.PLAYING,
  result: null,
  feedback: null,
  checked: NO_CHECK,
  saveError: '',
  ...extra,
});
const solvedState = (result) => ({ ...playing(), phase: PHASE.SOLVED, result });

export function initialPlayerState({ progress, guestClock }) {
  if (progress?.solvedAt) return solvedState({ timeMs: progress.timeMs, guest: false });
  if (!progress && guestClockStatus(guestClock) === GUEST_CLOCK.SOLVED) {
    return solvedState({ timeMs: guestClock.timeMs, guest: true });
  }
  return playing();
}

const countOf = (entries, status) => entries.filter((s) => s === status).length;

function checkedState(state, { rowsKey, entries }) {
  const right = countOf(entries, 'right');
  const wrong = countOf(entries, 'wrong');
  return {
    ...state,
    phase: PHASE.PLAYING,
    checked: { rowsKey, status: Object.fromEntries(entries.map((s, i) => [i, s])) },
    feedback: {
      type: wrong ? 'error' : 'success',
      text: `${right} right, ${wrong} wrong, ${entries.length - right - wrong} unfinished.`,
    },
  };
}

const notSolvedText = ({ wrong, incomplete }) =>
  `Not quite: ${wrong} wrong and ${incomplete} unfinished. Use Check to find them.`;

// One transition function; any pair not listed here leaves the state unchanged.
export function playerReducer(state, event) {
  const { phase } = state;
  const { type } = event;
  if (phase === PHASE.SOLVED) return state;

  if (type === PLAYER_EVENT.SAVE_FAILED) return { ...state, saveError: event.error };
  if (type === PLAYER_EVENT.SAVED) return state.saveError ? { ...state, saveError: '' } : state;

  if (phase === PHASE.PLAYING && type === PLAYER_EVENT.REQUEST) {
    return { ...state, phase: PHASE.REQUESTING, feedback: null };
  }
  if (phase !== PHASE.REQUESTING) return state;

  switch (type) {
    case PLAYER_EVENT.CHECKED:
      return checkedState(state, event);
    case PLAYER_EVENT.NOT_SOLVED:
      return { ...state, phase: PHASE.PLAYING, feedback: { type: 'error', text: notSolvedText(event) } };
    case PLAYER_EVENT.FAILED:
      return { ...state, phase: PHASE.PLAYING, feedback: { type: 'error', text: event.error } };
    case PLAYER_EVENT.SOLVED:
      return solvedState(event.result);
    default:
      return state;
  }
}
