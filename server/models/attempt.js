const mongoose = require('mongoose');

// One player's work on one day's puzzle: saved letters, timer and solve.
const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    // Rows like the puzzle solution: '#' blocks, ' ' blanks, A-Z letters.
    grid: { type: [String], default: [] },
    startedAt: { type: Date, required: true },
    checks: { type: Number, default: 0 },
    solvedAt: Date,
    timeMs: Number,
  },
  { timestamps: true },
);

attemptSchema.index({ user: 1, date: 1 }, { unique: true });
// Matches the leaderboard sort, ties broken by who finished first.
attemptSchema.index({ date: 1, timeMs: 1, solvedAt: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);
