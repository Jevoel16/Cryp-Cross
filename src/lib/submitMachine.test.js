import { describe, expect, it } from 'vitest';
import { SUBMIT, SUBMIT_EVENT, idleSubmit, submitMessage, submitReducer } from './submitMachine';

const submit = { type: SUBMIT_EVENT.SUBMIT };
const submitting = submitReducer(idleSubmit, submit);
const failed = submitReducer(submitting, { type: SUBMIT_EVENT.FAILED, message: 'That username is taken' });
const succeeded = submitReducer(submitting, { type: SUBMIT_EVENT.SUCCEEDED, message: 'Username updated.' });

describe('submitReducer', () => {
  it('idle -> submitting -> success or error', () => {
    expect(submitting).toEqual({ status: SUBMIT.SUBMITTING, message: '' });
    expect(succeeded).toEqual({ status: SUBMIT.SUCCESS, message: 'Username updated.' });
    expect(failed).toEqual({ status: SUBMIT.ERROR, message: 'That username is taken' });
  });

  it('can submit again after a result, clearing the old message', () => {
    expect(submitReducer(failed, submit)).toEqual({ status: SUBMIT.SUBMITTING, message: '' });
    expect(submitReducer(succeeded, submit)).toEqual({ status: SUBMIT.SUBMITTING, message: '' });
  });

  it('reset returns to idle from a result', () => {
    expect(submitReducer(failed, { type: SUBMIT_EVENT.RESET })).toBe(idleSubmit);
  });

  it('rejects a double submit, a reset mid-flight and unrequested results', () => {
    expect(submitReducer(submitting, submit)).toBe(submitting);
    expect(submitReducer(submitting, { type: SUBMIT_EVENT.RESET })).toBe(submitting);
    expect(submitReducer(idleSubmit, { type: SUBMIT_EVENT.SUCCEEDED, message: 'x' })).toBe(idleSubmit);
    expect(submitReducer(failed, { type: SUBMIT_EVENT.FAILED, message: 'y' })).toBe(failed);
    expect(submitReducer(idleSubmit, { type: 'nope' })).toBe(idleSubmit);
  });
});

describe('submitMessage', () => {
  it('only success and error carry a message', () => {
    expect(submitMessage(idleSubmit)).toBeNull();
    expect(submitMessage(submitting)).toBeNull();
    expect(submitMessage(failed)).toEqual({ type: 'error', text: 'That username is taken' });
    expect(submitMessage(succeeded)).toEqual({ type: 'success', text: 'Username updated.' });
    expect(submitMessage({ status: SUBMIT.SUCCESS, message: '' })).toBeNull();
  });
});
