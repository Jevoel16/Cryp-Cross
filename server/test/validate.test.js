const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validateLogin, validateUsername, validatePasswordChange, safeRedirectPath } = require('../lib/validate');

const NOT_OBJECT = ['Request body must be a JSON object'];

describe('validators', () => {
  test('every validator refuses a body that is not an object', () => {
    for (const validate of [validateLogin, validateUsername, validatePasswordChange]) {
      assert.deepEqual(validate(null).errors, NOT_OBJECT);
      assert.deepEqual(validate(['a']).errors, NOT_OBJECT);
      assert.deepEqual(validate('text').errors, NOT_OBJECT);
    }
  });

  test('validateUsername trims, lowercases and checks the pattern', () => {
    assert.deepEqual(validateUsername({ username: '  Solver_1 ' }), { errors: [], data: { username: 'solver_1' } });
    for (const username of ['ab', 'a'.repeat(21), 'has space', 'dash-ed', 42, undefined]) {
      assert.equal(validateUsername({ username }).errors.length, 1);
    }
  });

  test('validateLogin needs a username and a password', () => {
    assert.deepEqual(validateLogin({ username: ' Demo ', password: 'secret' }), {
      errors: [],
      data: { username: 'demo', password: 'secret' },
    });
    assert.deepEqual(validateLogin({}).errors, ['username is required', 'password is required']);
    assert.deepEqual(validateLogin({ username: 'demo', password: 5 }).errors, ['password is required']);
  });

  test('validatePasswordChange enforces the length limits', () => {
    const ok = validatePasswordChange({ password: 'long-enough-1' });
    assert.deepEqual(ok, { errors: [], data: { password: 'long-enough-1', currentPassword: null } });
    assert.deepEqual(validatePasswordChange({}).errors, ['password is required']);
    assert.deepEqual(validatePasswordChange({ password: 'short' }).errors, ['password must be at least 10 characters']);
    assert.deepEqual(validatePasswordChange({ password: 'é'.repeat(40) }).errors, [
      'password must be at most 72 bytes',
    ]);
  });

  test('validatePasswordChange keeps a usable current password and refuses a bad one', () => {
    const body = { password: 'long-enough-1' };
    assert.equal(validatePasswordChange({ ...body, currentPassword: 'old-one' }).data.currentPassword, 'old-one');
    assert.equal(validatePasswordChange({ ...body, currentPassword: '' }).data.currentPassword, null);
    assert.deepEqual(validatePasswordChange({ ...body, currentPassword: 7 }).errors, ['currentPassword is not valid']);
    assert.deepEqual(validatePasswordChange({ ...body, currentPassword: 'x'.repeat(201) }).errors, [
      'currentPassword is not valid',
    ]);
  });

  test('safeRedirectPath allows same-site paths only', () => {
    assert.equal(safeRedirectPath('/account'), '/account');
    assert.equal(safeRedirectPath('/leaderboard?date=2026-11-12'), '/leaderboard?date=2026-11-12');
    for (const value of ['https://evil.example', '//evil.example', 'account', '/a\\b', '/a\nb', '/'.repeat(201), 5]) {
      assert.equal(safeRedirectPath(value), '/play');
    }
    assert.equal(safeRedirectPath(undefined, '/account'), '/account');
  });
});
