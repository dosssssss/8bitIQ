const express = require('express');

const router = express.Router();

// Health check so we can confirm the server is up.
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'ok' });
});

router.use('/game', require('./game')); // POST /api/game/start, /result, /end
router.use('/leaderboard', require('./leaderboard')); // GET /api/leaderboard

router.use('/', require('./register')); // POST /api/register
router.use('/', require('./login')); // POST /api/login

// More feature routes get mounted here as each Trello card lands.

module.exports = router;
