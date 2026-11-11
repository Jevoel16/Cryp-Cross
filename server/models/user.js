const mongoose = require('mongoose');

// Created only via GitHub/Google (no email stored); an optional password enables username login.
const userSchema = new mongoose.Schema(
  {
    // Stored lowercase so "Alice" and "alice" can't both exist.
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9_]{3,20}$/ },
    // Missing until the player sets a password on the Account page.
    passwordHash: String,
    // Sessions created before this time are rejected (set when the password changes).
    passwordChangedAt: Date,
    // Linked OAuth accounts (provider user IDs).
    githubId: { type: String, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    // The shared demo account: it can play but not change itself, and it is never ranked.
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const PROVIDERS = Object.freeze(['github', 'google']);
const SIGN_IN_METHOD = Object.freeze({ PASSWORD: 'password', GITHUB: 'github', GOOGLE: 'google' });

// Every way this account can sign in; the list must never be empty.
function signInMethods(user) {
  const methods = PROVIDERS.filter((p) => user[`${p}Id`]);
  return user.passwordHash ? [SIGN_IN_METHOD.PASSWORD, ...methods] : methods;
}

// Removing a method is allowed only while another one remains.
const canRemoveSignInMethod = (user, method) => signInMethods(user).some((m) => m !== method);

userSchema.pre('validate', function requireSignInMethod(next) {
  next(signInMethods(this).length ? undefined : new Error('An account needs at least one way to sign in'));
});

userSchema.methods.toPublic = function toPublic() {
  return {
    username: this.username,
    hasPassword: Boolean(this.passwordHash),
    providers: PROVIDERS.filter((p) => this[`${p}Id`]),
    ...(this.isDemo ? { demo: true } : {}),
  };
};

userSchema.statics.signInMethods = signInMethods;
userSchema.statics.canRemoveSignInMethod = canRemoveSignInMethod;
userSchema.statics.SIGN_IN_METHOD = SIGN_IN_METHOD;

module.exports = mongoose.model('User', userSchema);
