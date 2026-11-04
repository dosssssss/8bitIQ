const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

router.post('/start', gameController.startGame);
router.post('/result', gameController.submitResult);

module.exports = router;
