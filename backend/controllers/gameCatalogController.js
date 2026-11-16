const gameCatalogService = require('../services/gameCatalogService');
const { notFound } = require('../utils/apiError');

async function listGames(req, res, next) {
  try {
    const games = await gameCatalogService.listGames();
    res.json({ success: true, games });
  } catch (err) {
    next(err);
  }
}

async function getGame(req, res, next) {
  try {
    const { id } = req.params;
    if (!/^[A-Za-z0-9_]{1,50}$/.test(id)) throw notFound('Game not found');

    const game = await gameCatalogService.getGame(id);
    if (!game) throw notFound('Game not found');
    res.json({ success: true, game });
  } catch (err) {
    next(err);
  }
}

module.exports = { listGames, getGame };