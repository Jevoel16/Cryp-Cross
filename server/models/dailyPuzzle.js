const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    number: { type: Number, required: true },
    direction: { type: String, enum: ['across', 'down'], required: true },
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    length: { type: Number, required: true },
    answer: { type: String, required: true },
    clue: { type: String, required: true },
    cipherClue: { type: String, required: true },
  },
  { _id: false }
);

// Stored on first request for a day so the puzzle stays fixed even if the word list changes.
const dailyPuzzleSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true },
    cipher: {
      type: { type: String, enum: ['caesar', 'atbash', 'vigenere'], required: true },
      shift: Number,
      key: String,
      keyClue: String,
    },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    solution: { type: [String], required: true },
    entries: { type: [entrySchema], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyPuzzle', dailyPuzzleSchema);
