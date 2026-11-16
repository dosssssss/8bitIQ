import type { GameId } from "./game.types";
import type { GameSession } from "./game-session";
import { submitGameResult } from "./game-session";

import {
  generateCountingChallenge,
  validateCountingAnswer,
  type CountingChallenge,
} from "../modules/games/counting-circles/counting-circles";

import {
  generateCircleSortingChallenge,
  validateCircleSortingAnswer,
  type CircleSortingChallenge,
} from "../modules/games/circle-sorting/circle-sorting";

import {
  generateEmojiMatchChallenge,
  validateEmojiMatch,
  type EmojiMatchChallenge,
} from "../modules/games/emoji-match/emoji-match";

import {
  generateQuickMathChallenge,
  validateMathAnswer,
  type QuickMathChallenge,
} from "../modules/games/quick-math/quick-math";

import {
  generatePatternChallenge,
  validatePatternAnswer,
  type PatternChallenge,
  type PatternColor,
} from "../modules/games/remember-pattern/remember-pattern";

let challengeSequence = 0;

export type ActiveGameChallenge =
  | { challengeId: string; gameId: "counting-circles"; challenge: CountingChallenge }
  | { challengeId: string; gameId: "circle-sorting"; challenge: CircleSortingChallenge }
  | { challengeId: string; gameId: "emoji-match"; challenge: EmojiMatchChallenge }
  | { challengeId: string; gameId: "quick-math"; challenge: QuickMathChallenge }
  | { challengeId: string; gameId: "remember-pattern"; challenge: PatternChallenge };

export type GameAnswer =
  | number
  | number[]
  | PatternColor[]
  | { firstTileId: number; secondTileId: number };

export function createGameChallenge(gameId: GameId): ActiveGameChallenge {
  const challengeId = `challenge-${++challengeSequence}`;

  switch (gameId) {
    case "counting-circles":
      return { challengeId, gameId, challenge: generateCountingChallenge() };
    case "circle-sorting":
      return { challengeId, gameId, challenge: generateCircleSortingChallenge() };
    case "emoji-match":
      return { challengeId, gameId, challenge: generateEmojiMatchChallenge() };
    case "quick-math":
      return { challengeId, gameId, challenge: generateQuickMathChallenge() };
    case "remember-pattern":
      return { challengeId, gameId, challenge: generatePatternChallenge() };
  }
}

export function validateGameAnswer(
  active: ActiveGameChallenge,
  answer: GameAnswer,
): boolean {
  switch (active.gameId) {
    case "counting-circles":
      return typeof answer === "number" &&
        validateCountingAnswer(active.challenge, answer);

    case "circle-sorting":
      return Array.isArray(answer) &&
        answer.every((value) => typeof value === "number") &&
        validateCircleSortingAnswer(active.challenge, answer);

    case "emoji-match":
      return typeof answer === "object" &&
        answer !== null &&
        !Array.isArray(answer) &&
        "firstTileId" in answer &&
        "secondTileId" in answer &&
        typeof answer.firstTileId === "number" &&
        typeof answer.secondTileId === "number" &&
        validateEmojiMatch(
          active.challenge,
          answer.firstTileId,
          answer.secondTileId,
        );

    case "quick-math":
      return typeof answer === "number" &&
        validateMathAnswer(active.challenge, answer);

    case "remember-pattern":
      return Array.isArray(answer) &&
        answer.every((color) =>
          typeof color === "string" &&
          ["red", "blue", "green", "yellow"].includes(color),
        ) &&
        validatePatternAnswer(active.challenge, answer as PatternColor[]);
  }
}

export function answerGameChallenge(
  session: GameSession,
  active: ActiveGameChallenge,
  answer: GameAnswer,
) {
  if (
    !session.isActive ||
    session.answeredChallengeIds.includes(active.challengeId)
  ) {
    return {
      correct: false,
      alreadyAnswered: true,
      gameId: active.gameId,
      session,
    };
  }

  const correct = validateGameAnswer(active, answer);
  const updatedSession = submitGameResult(session, active.gameId, correct);

  return {
    correct,
    alreadyAnswered: false,
    gameId: active.gameId,
    session: {
      ...updatedSession,
      answeredChallengeIds: [
        ...session.answeredChallengeIds,
        active.challengeId,
      ],
    },
  };
}
