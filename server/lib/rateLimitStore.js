const mongoose = require('mongoose');

// Rate-limit counters in MongoDB so limits hold across serverless instances.
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

  // One atomic update: count the hit, or start a new window if the old one ended.
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

// Shared store when MongoDB is connected; otherwise express-rate-limit's memory store.
function createRateLimitStore(prefix) {
  return mongoose.connection.readyState === 1 ? new MongoRateLimitStore({ prefix }) : undefined;
}

module.exports = { MongoRateLimitStore, createRateLimitStore, RateLimit };
