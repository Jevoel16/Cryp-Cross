const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // Stored lowercase so "Alice" and "alice" can't both register.
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9_]{3,20}$/ },
    // Missing for accounts that only sign in with GitHub or Google.
    passwordHash: String,
    emailVerified: { type: Boolean, default: false },
    // Only SHA-256 hashes of one-time tokens are stored, never the tokens themselves.
    verifyTokenHash: { type: String, index: true, sparse: true },
    verifyTokenExpires: Date,
    resetTokenHash: { type: String, index: true, sparse: true },
    resetTokenExpires: Date,
    // Sessions created before this time are rejected (set on password reset).
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
    email: this.email,
    emailVerified: this.emailVerified,
    hasPassword: Boolean(this.passwordHash),
    providers: ['github', 'google'].filter((p) => this[`${p}Id`]),
  };
};

module.exports = mongoose.model('User', userSchema);
