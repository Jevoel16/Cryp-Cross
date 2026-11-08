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
