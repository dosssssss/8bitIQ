const express = require('express');
const gameCatalogController = require('../controllers/gameCatalogController');

const router = express.Router();

router.get('/', gameCatalogController.listGames);
router.get('/:id', gameCatalogController.getGame);

module.exports = router;