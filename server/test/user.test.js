const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/user');

const { PASSWORD, GITHUB, GOOGLE } = User.SIGN_IN_METHOD;

describe('account sign-in methods', () => {
  test('lists every method the account has', () => {
    assert.deepEqual(User.signInMethods({}), []);
    assert.deepEqual(User.signInMethods({ passwordHash: 'h' }), [PASSWORD]);
    assert.deepEqual(User.signInMethods({ githubId: '1', googleId: '2' }), [GITHUB, GOOGLE]);
    assert.deepEqual(User.signInMethods({ passwordHash: 'h', googleId: '2' }), [PASSWORD, GOOGLE]);
  });

  test('a method can be removed only while another remains', () => {
    assert.equal(User.canRemoveSignInMethod({ githubId: '1' }, GITHUB), false);
    assert.equal(User.canRemoveSignInMethod({ githubId: '1', googleId: '2' }, GITHUB), true);
    assert.equal(User.canRemoveSignInMethod({ githubId: '1', passwordHash: 'h' }, GITHUB), true);
  });

  test('an account with no way to sign in is rejected before saving', async () => {
    await assert.rejects(new User({ username: 'nobody' }).validate(), /at least one way to sign in/);
    await new User({ username: 'alice', githubId: '1' }).validate();
    await new User({ username: 'bob', passwordHash: 'h' }).validate();
  });
});
