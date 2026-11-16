import test from "node:test";
import assert from "node:assert/strict";

import {
  generateCountingChallenge,
  validateCountingAnswer,
} from "../src/modules/games/counting-circles/counting-circles";

import {
  generateCircleSortingChallenge,
  validateCircleSortingAnswer,
} from "../src/modules/games/circle-sorting/circle-sorting";

import {
  generateEmojiMatchChallenge,
  validateEmojiMatch,
} from "../src/modules/games/emoji-match/emoji-match";

import {
  generateQuickMathChallenge,
  validateMathAnswer,
} from "../src/modules/games/quick-math/quick-math";

import {
  generatePatternChallenge,
  validatePatternAnswer,
} from "../src/modules/games/remember-pattern/remember-pattern";

test("Counting Circles generates valid challenges and checks answers", () => {
  const challenge = generateCountingChallenge();

  assert.ok(challenge.circleCount >= 1 && challenge.circleCount <= 15);
  assert.equal(challenge.choices.length, 4);
  assert.ok(challenge.choices.includes(challenge.circleCount));
  assert.equal(validateCountingAnswer(challenge, challenge.circleCount), true);
  assert.equal(validateCountingAnswer(challenge, -1), false);
});

test("Circle Sorting generates five unique circles and validates order", () => {
  const challenge = generateCircleSortingChallenge();

  assert.equal(challenge.circles.length, 5);
  assert.equal(new Set(challenge.circles).size, 5);

  const correctOrder = [...challenge.circles].sort((a, b) =>
    challenge.direction === "ascending" ? a - b : b - a,
  );

  assert.equal(validateCircleSortingAnswer(challenge, correctOrder), true);
  assert.equal(validateCircleSortingAnswer(challenge, [...correctOrder].reverse()), false);
});

test("Emoji Match generates eight pairs and validates matches", () => {
  const challenge = generateEmojiMatchChallenge();

  assert.equal(challenge.tiles.length, 16);
  assert.equal(challenge.totalPairs, 8);

  const firstTile = challenge.tiles[0]!;
  const matchingTile = challenge.tiles.find(
    (tile) => tile.id !== firstTile.id && tile.emoji === firstTile.emoji,
  )!;

  assert.equal(
    validateEmojiMatch(challenge, firstTile.id, matchingTile.id),
    true,
  );
  assert.equal(
    validateEmojiMatch(challenge, firstTile.id, firstTile.id),
    false,
  );
});

test("Quick Math generates valid equations and checks answers", () => {
  const challenge = generateQuickMathChallenge();

  const expected =
    challenge.operator === "+"
      ? challenge.firstNumber + challenge.secondNumber
      : challenge.operator === "-"
        ? challenge.firstNumber - challenge.secondNumber
        : challenge.firstNumber * challenge.secondNumber;

  assert.equal(challenge.correctAnswer, expected);
  assert.equal(challenge.choices.length, 4);
  assert.ok(challenge.choices.includes(expected));
  assert.equal(validateMathAnswer(challenge, expected), true);
  assert.equal(validateMathAnswer(challenge, expected + 1000), false);
});

test("Remember the Pattern generates and validates color sequences", () => {
  const challenge = generatePatternChallenge();

  assert.equal(challenge.sequence.length, 4);
  assert.equal(validatePatternAnswer(challenge, challenge.sequence), true);
  assert.equal(
    validatePatternAnswer(challenge, ["red", "red", "red", "red"]),
    challenge.sequence.every((color) => color === "red"),
  );
  assert.throws(() => generatePatternChallenge(0));
});

import {
  createInitialScore,
  applyGameResult,
} from "../src/shared/game-scoring";

test("Arcade scoring awards time and tracks completed games and streaks", () => {
  let score = createInitialScore();

  assert.equal(score.remainingTime, 120);

  score = applyGameResult(score, true);
  assert.equal(score.remainingTime, 128);
  assert.equal(score.completedGames, 1);
  assert.equal(score.currentStreak, 1);

  score = applyGameResult(score, true);
  assert.equal(score.remainingTime, 136);
  assert.equal(score.completedGames, 2);
  assert.equal(score.currentStreak, 2);
  assert.equal(score.bestStreak, 2);

  score = applyGameResult(score, false);
  assert.equal(score.remainingTime, 128);
  assert.equal(score.completedGames, 2);
  assert.equal(score.currentStreak, 0);
  assert.equal(score.bestStreak, 2);
});

test("Arcade scoring never allows negative remaining time", () => {
  const score = createInitialScore(4);
  const result = applyGameResult(score, false);

  assert.equal(result.remainingTime, 0);
});

test("Arcade scoring rejects invalid starting time", () => {
  assert.throws(() => createInitialScore(-1));
});

import {
  GAME_REGISTRY,
  getAllGames,
  getGameDefinition,
} from "../src/modules/games/game-registry";

test("Game registry contains all five minigames", () => {
  assert.equal(getAllGames().length, 5);
  assert.equal(Object.keys(GAME_REGISTRY).length, 5);
});

test("Game registry returns the correct game definition", () => {
  const game = getGameDefinition("quick-math");

  assert.equal(game.title, "Quick Math");
  assert.equal(game.id, "quick-math");
});

test("Counting Circles rejects answers outside the correct count", () => {
  const challenge = {
    circleCount: 1,
    choices: [1, 5, 9, 12],
  };

  assert.equal(validateCountingAnswer(challenge, 0), false);
  assert.equal(validateCountingAnswer(challenge, 15), false);
  assert.equal(validateCountingAnswer(challenge, 1), true);
});

test("Circle Sorting rejects duplicates, missing circles, and extra values", () => {
  const challenge = {
    circles: [10, 20, 30, 40, 50],
    direction: "ascending" as const,
  };

  assert.equal(
    validateCircleSortingAnswer(challenge, [10, 20, 20, 40, 50]),
    false,
  );

  assert.equal(
    validateCircleSortingAnswer(challenge, [10, 20, 30, 40, 60]),
    false,
  );

  assert.equal(
    validateCircleSortingAnswer(challenge, [10, 20, 30, 40]),
    false,
  );
});

test("Emoji Match rejects nonexistent tile IDs", () => {
  const challenge = generateEmojiMatchChallenge();

  assert.equal(validateEmojiMatch(challenge, -1, 999), false);
});

test("Remember the Pattern rejects incomplete and incorrect sequences", () => {
  const challenge = generatePatternChallenge(5);

  const wrongSequence = [...challenge.sequence];
  wrongSequence[0] = challenge.sequence[0] === "red" ? "blue" : "red";

  assert.equal(validatePatternAnswer(challenge, wrongSequence), false);
  assert.equal(validatePatternAnswer(challenge, challenge.sequence.slice(1)), false);
  assert.throws(() => generatePatternChallenge(31));
});

test("Quick Math rejects answers that are not correct", () => {
  const challenge = generateQuickMathChallenge();

  assert.equal(validateMathAnswer(challenge, challenge.correctAnswer + 1), false);
});

import {
  startGameSession,
  submitGameResult,
  advanceSessionTime,
} from "../src/shared/game-session";

test("Game session starts with 120 seconds and zeroed stats", () => {
  const session = startGameSession();

  assert.equal(session.isActive, true);
  assert.equal(session.score.remainingTime, 120);
  assert.equal(session.score.completedGames, 0);
  assert.equal(session.score.currentStreak, 0);
  assert.equal(session.score.bestStreak, 0);
});

test("Successful games award time and update session stats", () => {
  const session = startGameSession();
  const updated = submitGameResult(session, "quick-math", true);

  assert.equal(updated.score.remainingTime, 128);
  assert.equal(updated.score.completedGames, 1);
  assert.equal(updated.score.currentStreak, 1);
  assert.equal(updated.score.bestStreak, 1);
  assert.equal(updated.isActive, true);
});

test("Failed games deduct time and reset the current streak", () => {
  let session = startGameSession();

  session = submitGameResult(session, "quick-math", true);
  session = submitGameResult(session, "emoji-match", true);
  session = submitGameResult(session, "counting-circles", false);

  assert.equal(session.score.remainingTime, 128);
  assert.equal(session.score.completedGames, 2);
  assert.equal(session.score.currentStreak, 0);
  assert.equal(session.score.bestStreak, 2);
});

test("Session ends when the timer reaches zero", () => {
  const session = startGameSession(10);
  const updated = advanceSessionTime(session, 10);

  assert.equal(updated.score.remainingTime, 0);
  assert.equal(updated.isActive, false);
});

test("Inactive sessions cannot accept more game results", () => {
  const session = advanceSessionTime(startGameSession(5), 5);
  const updated = submitGameResult(session, "quick-math", true);

  assert.equal(updated, session);
  assert.equal(updated.score.completedGames, 0);
});

test("Session timer rejects invalid elapsed time", () => {
  const session = startGameSession();

  assert.throws(() => advanceSessionTime(session, -1));
  assert.throws(() => advanceSessionTime(session, 1.5));
});

import {
  createGameChallenge,
  validateGameAnswer,
  answerGameChallenge,
} from "../src/shared/game-engine";

test("Game engine creates challenges for all five games", () => {
  const gameIds = [
    "counting-circles",
    "circle-sorting",
    "emoji-match",
    "quick-math",
    "remember-pattern",
  ] as const;

  for (const gameId of gameIds) {
    const active = createGameChallenge(gameId);
    assert.equal(active.gameId, gameId);
    assert.ok(active.challenge);
  }
});

test("Game engine validates a correct Counting Circles answer", () => {
  const active = createGameChallenge("counting-circles");

  if (active.gameId !== "counting-circles") {
    throw new Error("Unexpected challenge type");
  }

  assert.equal(
    validateGameAnswer(active, active.challenge.circleCount),
    true,
  );
  assert.equal(validateGameAnswer(active, -100), false);
});

test("Game engine updates the session after a correct answer", () => {
  const session = startGameSession();
  const active = createGameChallenge("quick-math");

  if (active.gameId !== "quick-math") {
    throw new Error("Unexpected challenge type");
  }

  const result = answerGameChallenge(
    session,
    active,
    active.challenge.correctAnswer,
  );

  assert.equal(result.correct, true);
  assert.equal(result.session.score.completedGames, 1);
  assert.equal(result.session.score.remainingTime, 128);
});

test("Game engine deducts time after an incorrect answer", () => {
  const session = startGameSession();
  const active = createGameChallenge("counting-circles");

  if (active.gameId !== "counting-circles") {
    throw new Error("Unexpected challenge type");
  }

  const result = answerGameChallenge(
    session,
    active,
    active.challenge.circleCount + 100,
  );

  assert.equal(result.correct, false);
  assert.equal(result.session.score.completedGames, 0);
  assert.equal(result.session.score.remainingTime, 112);
});

test("Game engine rejects answers with the wrong format", () => {
  const active = createGameChallenge("emoji-match");
  assert.equal(validateGameAnswer(active, 42), false);
});

test("Game engine prevents the same challenge from being submitted twice", () => {
  const session = startGameSession();
  const active = createGameChallenge("quick-math");

  if (active.gameId !== "quick-math") {
    throw new Error("Unexpected challenge type");
  }

  const first = answerGameChallenge(
    session,
    active,
    active.challenge.correctAnswer,
  );

  const second = answerGameChallenge(
    first.session,
    active,
    active.challenge.correctAnswer,
  );

  assert.equal(first.correct, true);
  assert.equal(first.alreadyAnswered, false);
  assert.equal(second.alreadyAnswered, true);
  assert.equal(second.session.score.completedGames, 1);
  assert.equal(second.session.score.remainingTime, 128);
});

test("Game engine assigns unique IDs to generated challenges", () => {
  const first = createGameChallenge("counting-circles");
  const second = createGameChallenge("counting-circles");

  assert.notEqual(first.challengeId, second.challengeId);
});

import {
  createEmojiMatchState,
  revealEmojiTile,
  hideEmojiMismatch,
} from "../src/modules/games/emoji-match/emoji-match";

test("Emoji Match keeps a matching pair revealed", () => {
  const challenge = generateEmojiMatchChallenge();
  let state = createEmojiMatchState(challenge);

  const first = challenge.tiles[0]!;
  const partner = challenge.tiles.find(
    (tile) => tile.id !== first.id && tile.emoji === first.emoji,
  )!;

  state = revealEmojiTile(state, first.id);
  state = revealEmojiTile(state, partner.id);

  assert.equal(state.matchedPairs, 1);
  assert.equal(state.attempts, 1);
  assert.equal(state.selectedTileIds.length, 0);
  assert.equal(state.tiles.find((tile) => tile.id === first.id)?.isMatched, true);
  assert.equal(state.tiles.find((tile) => tile.id === partner.id)?.isMatched, true);
});

test("Emoji Match hides mismatched tiles when requested", () => {
  const challenge = generateEmojiMatchChallenge();
  let state = createEmojiMatchState(challenge);

  const first = challenge.tiles[0]!;
  const different = challenge.tiles.find(
    (tile) => tile.emoji !== first.emoji,
  )!;

  state = revealEmojiTile(state, first.id);
  state = revealEmojiTile(state, different.id);

  assert.equal(state.attempts, 1);
  assert.equal(state.selectedTileIds.length, 2);

  state = hideEmojiMismatch(state);

  assert.equal(state.selectedTileIds.length, 0);
  assert.equal(state.tiles.every((tile) => !tile.isFaceUp), true);
});

test("Emoji Match does not allow a third tile before hiding a mismatch", () => {
  const challenge = generateEmojiMatchChallenge();
  let state = createEmojiMatchState(challenge);

  const first = challenge.tiles[0]!;
  const different = challenge.tiles.find(
    (tile) => tile.emoji !== first.emoji,
  )!;
  const third = challenge.tiles.find(
    (tile) => tile.id !== first.id && tile.id !== different.id,
  )!;

  state = revealEmojiTile(state, first.id);
  state = revealEmojiTile(state, different.id);

  const unchanged = revealEmojiTile(state, third.id);

  assert.deepEqual(unchanged, state);
});

test("Emoji Match completes after all eight pairs are found", () => {
  const challenge = generateEmojiMatchChallenge();
  let state = createEmojiMatchState(challenge);

  const pairs = new Map<string, number[]>();

  for (const tile of challenge.tiles) {
    const ids = pairs.get(tile.emoji) ?? [];
    ids.push(tile.id);
    pairs.set(tile.emoji, ids);
  }

  for (const ids of pairs.values()) {
    state = revealEmojiTile(state, ids[0]!);
    state = revealEmojiTile(state, ids[1]!);
  }

  assert.equal(state.matchedPairs, 8);
  assert.equal(state.status, "completed");
  assert.equal(state.attempts, 8);
});
