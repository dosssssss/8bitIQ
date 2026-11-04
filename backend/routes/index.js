const express = require('express');

const router = express.Router();

// Health check so we can confirm the server is up.
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'ok' });
});

router.use('/game', require('./game')); // POST /api/game/start, /result, /end

// More feature routes get mounted here as each Trello card lands, for example:
// router.use('/', require('./auth'));         // POST /api/register, /api/login
// router.use('/leaderboard', require('./leaderboard'));

module.exports = router;
