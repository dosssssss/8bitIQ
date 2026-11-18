import { randomUUID } from "node:crypto";

import {
  generateCountingChallenge,
  validateCountingAnswer,
} from "./counting-circles/counting-circles";

import {
  generateCircleSortingChallenge,
  validateCircleSortingAnswer,
} from "./circle-sorting/circle-sorting";

import {
  generateEmojiMatchChallenge,
  validateEmojiMatch,
} from "./emoji-match/emoji-match";

import {
  generateQuickMathChallenge,
  validateMathAnswer,
} from "./quick-math/quick-math";

import {
  generatePatternChallenge,
  validatePatternAnswer,
  type PatternColor,
} from "./remember-pattern/remember-pattern";

export type GameId =
  | "counting-circles"
  | "circle-sorting"
  | "emoji-match"
  | "quick-math"
  | "remember-pattern";

export type GameAnswer =
  | number
  | number[]
  | PatternColor[]
  | { firstTileId: number; secondTileId: number };

export function createGameChallenge(gameId: GameId) {
  const challengeId = randomUUID();

  switch (gameId) {
    case "counting-circles": {
      const challenge = generateCountingChallenge();

      return {
        challengeId,
        gameId,
        publicChallenge: { choices: challenge.choices },
        validate: (answer: GameAnswer) =>
          typeof answer === "number" &&
          validateCountingAnswer(challenge, answer),
      };
    }

    case "circle-sorting": {
      const challenge = generateCircleSortingChallenge();

      return {
        challengeId,
        gameId,
        publicChallenge: challenge,
        validate: (answer: GameAnswer) =>
          Array.isArray(answer) &&
          answer.every((value) => typeof value === "number") &&
          validateCircleSortingAnswer(challenge, answer),
      };
    }

    case "emoji-match": {
      const challenge = generateEmojiMatchChallenge();

      return {
        challengeId,
        gameId,
        publicChallenge: challenge,
        validate: (answer: GameAnswer) => {
          if (
            typeof answer !== "object" ||
            answer === null ||
            Array.isArray(answer) ||
            !("firstTileId" in answer) ||
            !("secondTileId" in answer)
          ) return false;

          return validateEmojiMatch(
            challenge,
            answer.firstTileId,
            answer.secondTileId,
          );
        },
      };
    }

    case "quick-math": {
      const challenge = generateQuickMathChallenge();

      return {
        challengeId,
        gameId,
        publicChallenge: {
          firstNumber: challenge.firstNumber,
          secondNumber: challenge.secondNumber,
          operator: challenge.operator,
          choices: challenge.choices,
        },
        validate: (answer: GameAnswer) =>
          typeof answer === "number" &&
          validateMathAnswer(challenge, answer),
      };
    }

    case "remember-pattern": {
      const challenge = generatePatternChallenge();

      return {
        challengeId,
        gameId,
        publicChallenge: challenge,
        validate: (answer: GameAnswer) =>
          Array.isArray(answer) &&
          answer.every((color) =>
            typeof color === "string" && ["red", "blue", "green", "yellow"].includes(color),
          ) &&
          validatePatternAnswer(challenge, answer as PatternColor[]),
      };
    }
  }
}
