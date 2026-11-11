// The attempt lifecycle as one explicit machine (see docs/state-machines.md#attempt).
const ATTEMPT_STATUS = Object.freeze({ NOT_STARTED: 'notStarted', STARTED: 'started', SOLVED: 'solved' });
const ATTEMPT_EVENT = Object.freeze({ OPEN: 'open', SAVE: 'save', CHECK: 'check', SOLVE: 'solve' });

const { NOT_STARTED, STARTED, SOLVED } = ATTEMPT_STATUS;
const { OPEN, SAVE, CHECK, SOLVE } = ATTEMPT_EVENT;

// Missing pairs are rejected. Saving or checking a solved grid is allowed but changes nothing.
const TRANSITIONS = Object.freeze({
  [NOT_STARTED]: Object.freeze({ [OPEN]: STARTED }),
  [STARTED]: Object.freeze({ [OPEN]: STARTED, [SAVE]: STARTED, [CHECK]: STARTED, [SOLVE]: SOLVED }),
  [SOLVED]: Object.freeze({ [OPEN]: SOLVED, [SAVE]: SOLVED, [CHECK]: SOLVED }),
});

// Status is derived from the stored document, so old data needs no migration.
function attemptStatus(attempt) {
  if (!attempt) return NOT_STARTED;
  return attempt.solvedAt ? SOLVED : STARTED;
}

function nextAttemptStatus(status, event) {
  return TRANSITIONS[status]?.[event] ?? null;
}

// Mongo filter that makes a write apply only while the attempt is still unsolved.
const whileStarted = (filter) => ({ ...filter, solvedAt: { $exists: false } });

module.exports = { ATTEMPT_STATUS, ATTEMPT_EVENT, attemptStatus, nextAttemptStatus, whileStarted };
