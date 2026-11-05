const mongoose = require('mongoose');

// Hit counters shared by every API instance. On serverless hosts (Vercel) each instance
// has its own memory, so the default in-memory store would let attackers spread requests
// across instances; keeping the counts in MongoDB gives one limit per client.
const rateLimitSchema = new mongoose.Schema(
  {
    _id: String,
    hits: { type: Number, default: 0 },
    resetAt: { type: Date, required: true },
  },
  { versionKey: false }
);

// MongoDB drops expired windows by itself.
rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit = mongoose.models.RateLimit || mongoose.model('RateLimit', rateLimitSchema);

const DUPLICATE_KEY = 11000;

class MongoRateLimitStore {
  constructor({ prefix }) {
    this.prefix = prefix;
    // Counts are shared, so express-rate-limit must not assume they are per-process.
    this.localKeys = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  key(key) {
    return `${this.prefix}:${key}`;
  }

  // One atomic update: count the hit in the current window, or start a new window
  // when the old one has ended (or none exists yet).
  async increment(key) {
    const now = new Date();
    const live = { $gt: ['$resetAt', now] };
    const update = [
      {
        $set: {
          hits: { $cond: [live, { $add: ['$hits', 1] }, 1] },
          resetAt: { $cond: [live, '$resetAt', new Date(now.getTime() + this.windowMs)] },
        },
      },
    ];
    const run = () => RateLimit.findOneAndUpdate({ _id: this.key(key) }, update, { upsert: true, new: true }).lean();

    let doc;
    try {
      doc = await run();
    } catch (error) {
      // Two first hits racing on the same key: one insert wins, the other just retries as an update.
      if (error.code !== DUPLICATE_KEY) throw error;
      doc = await run();
    }
    return { totalHits: doc.hits, resetTime: doc.resetAt };
  }

  async decrement(key) {
    await RateLimit.updateOne({ _id: this.key(key), hits: { $gt: 0 } }, { $inc: { hits: -1 } });
  }

  async resetKey(key) {
    await RateLimit.deleteOne({ _id: this.key(key) });
  }
}

// Shared store when MongoDB is connected; otherwise undefined, so express-rate-limit
// falls back to its memory store (DB-less tests, same rule as the session store).
function createRateLimitStore(prefix) {
  return mongoose.connection.readyState === 1 ? new MongoRateLimitStore({ prefix }) : undefined;
}

module.exports = { MongoRateLimitStore, createRateLimitStore, RateLimit };
