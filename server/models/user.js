const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // Stored lowercase so "Alice" and "alice" can't both register.
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9_]{3,20}$/ },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    // Only SHA-256 hashes of one-time tokens are stored, never the tokens themselves.
    verifyTokenHash: { type: String, index: true, sparse: true },
    verifyTokenExpires: Date,
    resetTokenHash: { type: String, index: true, sparse: true },
    resetTokenExpires: Date,
    // Sessions created before this time are rejected (set on password reset).
    passwordChangedAt: Date,
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return { username: this.username, email: this.email, emailVerified: this.emailVerified };
};

module.exports = mongoose.model('User', userSchema);
