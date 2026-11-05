const express = require('express');
const DailyPuzzle = require('../models/dailyPuzzle');
const { getTodayPuzzle, toPublicPuzzle } = require('../puzzle/service');
const { dayKey, isValidDayKey } = require('../puzzle/dayKey');

const ARCHIVE_LIMIT = 60;
const router = express.Router();

router.get('/today', async (req, res, next) => {
  try {
    const puzzle = await getTodayPuzzle();
    res.json({ success: true, data: { ...toPublicPuzzle(puzzle), isToday: true } });
  } catch (error) {
    next(error);
  }
});

// Past puzzles that were actually played (stored), newest first.
router.get('/', async (req, res, next) => {
  try {
    const dates = await DailyPuzzle.find({ date: { $lt: dayKey() } })
      .sort({ date: -1 })
      .limit(ARCHIVE_LIMIT)
      .select('date cipher.type -_id')
      .lean();
    res.json({ success: true, data: dates.map((p) => ({ date: p.date, cipher: p.cipher.type })) });
  } catch (error) {
    next(error);
  }
});

// Only stored days are served, so the archive can't be used to fill the database.
router.get('/:date', async (req, res, next) => {
  const { date } = req.params;
  if (!isValidDayKey(date)) {
    return res.status(400).json({ success: false, message: 'Date must be YYYY-MM-DD' });
  }
  try {
    const today = dayKey();
    if (date > today) return res.status(404).json({ success: false, message: 'Puzzle not found' });
    if (date === today) {
      const puzzle = await getTodayPuzzle();
      return res.json({ success: true, data: { ...toPublicPuzzle(puzzle), isToday: true } });
    }
    const puzzle = await DailyPuzzle.findOne({ date }).lean();
    if (!puzzle) return res.status(404).json({ success: false, message: 'Puzzle not found' });
    res.json({ success: true, data: { ...toPublicPuzzle(puzzle, { reveal: true }), isToday: false } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
