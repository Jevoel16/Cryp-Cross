import { describe, expect, it } from 'vitest';
import { describedBy } from './forms';

describe('describedBy', () => {
  it('adds nothing without a message', () => {
    expect(describedBy(null, 'm')).toEqual({});
  });

  it('points at the message, and marks the field invalid only for errors', () => {
    expect(describedBy({ type: 'success', text: 'Saved' }, 'm')).toEqual({ 'aria-describedby': 'm' });
    expect(describedBy({ type: 'error', text: 'Taken' }, 'm')).toEqual({
      'aria-describedby': 'm',
      'aria-invalid': true,
    });
  });
});
