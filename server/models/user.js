const mongoose = require('mongoose');

// Accounts are created only through GitHub or Google sign-in, and no email address is
// stored. A player can add a password later to also log in with username + password.
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
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    username: this.username,
    hasPassword: Boolean(this.passwordHash),
    providers: ['github', 'google'].filter((p) => this[`${p}Id`]),
  };
};

module.exports = mongoose.model('User', userSchema);
