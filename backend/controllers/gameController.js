const sessionService = require('../services/sessionService');
const userService = require('../services/userService');
const validate = require('../utils/validate');
const asyncHandler = require('../utils/asyncHandler');
const { badRequest, notFound, conflict } = require('../utils/apiError');
const { createGameChallenge } = require('../.build/games/gameEngine.js');

const activeChallenges = new Map();
const GAME_IDS = ['emoji-match', 'quick-math'];

function findSession(sessionId) {
  const session = sessionService.getSession(sessionId);
  if (!session) throw notFound('Game session not found');
  return session;
}

// POST /api/game/start
// Body (optional): { playerId } once login is wired up.
async function startGame(req, res) {
  const input = validate.body(req);
  const playerId = validate.optionalString(input.playerId, 'playerId');
  if (playerId && !(await userService.playerExists(playerId))) {
    throw badRequest('Unknown playerId');
  }

  const session = sessionService.createSession({ playerId });
  res.status(201).json({ success: true, ...sessionService.toPublic(session) });
}

// POST /api/game/result
// Body: { sessionId, game, success }
// "game" is the mini-game's name (for example "wordGuess"). "success" is
// whether the player solved it.
function submitResult(req, res) {
  const input = validate.body(req);
  const sessionId = validate.requiredString(input.sessionId, 'sessionId');
  const success = validate.requiredBoolean(input.success, 'success');
  validate.optionalString(input.game, 'game', { maxLength: 50 });

  const session = findSession(sessionId);
  if (sessionService.isOver(session)) {
    // Saved in the background. If it fails, the 5-second check retries.
    sessionService.finishSession(session).catch(() => {});
    throw conflict('Game is over', { gameOver: true });
  }

  sessionService.applyResult(session, success);
  res.json({ success: true, ...sessionService.toPublic(session), gameOver: session.finished });
}


// POST /api/game/challenge
function createChallenge(req, res) {
  const input = validate.body(req);
  const sessionId = validate.requiredString(input.sessionId, 'sessionId');
  const gameId = validate.requiredString(input.gameId, 'gameId');

  if (!GAME_IDS.includes(gameId)) throw badRequest('Unsupported game');

  const session = findSession(sessionId);
  if (sessionService.isOver(session)) throw conflict('Game is over', { gameOver: true });

  const challenge = createGameChallenge(gameId);
  activeChallenges.set(challenge.challengeId, {
    sessionId,
    gameId,
    validate: challenge.validate,
    matchedTileIds: new Set(),
    matchedPairs: 0,
    totalPairs: challenge.publicChallenge.totalPairs || 0,
  });

  res.json({
    success: true,
    challengeId: challenge.challengeId,
    gameId,
    challenge: challenge.publicChallenge,
  });
}

// POST /api/game/answer
function submitAnswer(req, res) {
  const input = validate.body(req);
  const sessionId = validate.requiredString(input.sessionId, 'sessionId');
  const challengeId = validate.requiredString(input.challengeId, 'challengeId');

  const active = activeChallenges.get(challengeId);
  if (!active || active.sessionId !== sessionId) {
    throw badRequest('Invalid or already answered challenge');
  }

  const session = findSession(sessionId);
  if (sessionService.isOver(session)) {
    activeChallenges.delete(challengeId);
    throw conflict('Game is over', { gameOver: true });
  }

  const correct = active.validate(input.answer);

  if (active.gameId === 'emoji-match') {
    if (correct) {
      const { firstTileId, secondTileId } = input.answer || {};
      if (
        active.matchedTileIds.has(firstTileId) ||
        active.matchedTileIds.has(secondTileId)
      ) {
        throw badRequest('A matched tile cannot be reused');
      }

      active.matchedTileIds.add(firstTileId);
      active.matchedTileIds.add(secondTileId);
      active.matchedPairs += 1;
    }

    const completed = active.matchedPairs >= active.totalPairs;
    if (completed) {
      activeChallenges.delete(challengeId);
      sessionService.applyResult(session, true);
    }

    return res.json({
      success: true,
      correct,
      pairMatched: correct,
      completed,
      matchedPairs: active.matchedPairs,
      ...sessionService.toPublic(session),
      gameOver: session.finished,
    });
  }

  activeChallenges.delete(challengeId);
  sessionService.applyResult(session, correct);

  res.json({
    success: true,
    correct,
    completed: true,
    ...sessionService.toPublic(session),
    gameOver: session.finished,
  });
}

// POST /api/game/end
// Body: { sessionId }
// The page calls this when its countdown reaches 0. Returns the final
// result for the game over screen. Safe to call more than once.
async function endGame(req, res) {
  const input = validate.body(req);
  const sessionId = validate.requiredString(input.sessionId, 'sessionId');

  const session = findSession(sessionId);
  if (!sessionService.isOver(session)) {
    throw conflict('Game is still running', {
      timeRemaining: sessionService.getTimeRemaining(session),
    });
  }

  const finalResult = await sessionService.finishSession(session);
  res.json({
    success: true,
    gameOver: true,
    sessionId: session.id,
    score: finalResult.score,
    gamesCompleted: finalResult.gamesCompleted,
    bestStreak: finalResult.bestStreak,
  });
}

module.exports = {
  startGame: asyncHandler(startGame),
  submitResult: asyncHandler(submitResult),
  createChallenge: asyncHandler(createChallenge),
  submitAnswer: asyncHandler(submitAnswer),
  endGame: asyncHandler(endGame),
};
