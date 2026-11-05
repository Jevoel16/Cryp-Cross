// The puzzle day is a YYYY-MM-DD string in PUZZLE_TZ (default UTC).
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function puzzleTimeZone() {
  return process.env.PUZZLE_TZ || 'UTC';
}

function dayKey(date = new Date(), timeZone = puzzleTimeZone()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function isValidDayKey(value) {
  if (typeof value !== 'string' || !DATE_KEY.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// Day before a key, used for streaks.
function previousDayKey(key) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

module.exports = { dayKey, isValidDayKey, previousDayKey, puzzleTimeZone };
