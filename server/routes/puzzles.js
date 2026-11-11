const express = require('express');
const puzzles = require('../puzzle/service');
const { handle, ok } = require('../lib/httpError');

const router = express.Router();

router.get(
  '/today',
  handle(async (req, res) => ok(res, await puzzles.todayForPlayers())),
);

router.get(
  '/',
  handle(async (req, res) => ok(res, await puzzles.listArchive())),
);

router.get(
  '/:date',
  handle(async (req, res) => ok(res, await puzzles.puzzleForDate(req.params.date))),
);

module.exports = router;
