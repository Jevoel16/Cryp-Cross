const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { ATTEMPT_STATUS, ATTEMPT_EVENT, attemptStatus, nextAttemptStatus } = require('../lib/attemptStatus');

const { NOT_STARTED, STARTED, SOLVED } = ATTEMPT_STATUS;
const { OPEN, SAVE, CHECK, SOLVE } = ATTEMPT_EVENT;

describe('attempt status machine', () => {
  test('status is derived from the stored attempt', () => {
    assert.equal(attemptStatus(null), NOT_STARTED);
    assert.equal(attemptStatus({ startedAt: new Date() }), STARTED);
    assert.equal(attemptStatus({ startedAt: new Date(), solvedAt: new Date(), timeMs: 1 }), SOLVED);
  });

  test('every allowed transition', () => {
    assert.equal(nextAttemptStatus(NOT_STARTED, OPEN), STARTED);
    assert.equal(nextAttemptStatus(STARTED, OPEN), STARTED);
    assert.equal(nextAttemptStatus(STARTED, SAVE), STARTED);
    assert.equal(nextAttemptStatus(STARTED, CHECK), STARTED);
    assert.equal(nextAttemptStatus(STARTED, SOLVE), SOLVED);
    assert.equal(nextAttemptStatus(SOLVED, OPEN), SOLVED);
    assert.equal(nextAttemptStatus(SOLVED, SAVE), SOLVED);
    assert.equal(nextAttemptStatus(SOLVED, CHECK), SOLVED);
  });

  test('invalid transitions are rejected', () => {
    assert.equal(nextAttemptStatus(NOT_STARTED, SAVE), null);
    assert.equal(nextAttemptStatus(NOT_STARTED, CHECK), null);
    assert.equal(nextAttemptStatus(NOT_STARTED, SOLVE), null);
    assert.equal(nextAttemptStatus(SOLVED, SOLVE), null);
    assert.equal(nextAttemptStatus(STARTED, 'reopen'), null);
    assert.equal(nextAttemptStatus('unknown', OPEN), null);
  });
});
