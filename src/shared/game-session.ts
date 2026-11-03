import type { GameId } from "./game.types";
import {
  createInitialScore,
  applyGameResult,
  type ArcadeScore,
} from "./game-scoring";

export type GameSession = {
  score: ArcadeScore;
  isActive: boolean;
  answeredChallengeIds: string[];
};

export function startGameSession(startingTime = 120): GameSession {
  return {
    score: createInitialScore(startingTime),
    isActive: true,
    answeredChallengeIds: [],
  };
}

export function submitGameResult(
  session: GameSession,
  gameId: GameId,
  correct: boolean,
): GameSession {
  if (!session.isActive) return session;

  const score = applyGameResult(session.score, correct);

  return {
    ...session,
    score,
    isActive: score.remainingTime > 0,
  };
}

export function advanceSessionTime(
  session: GameSession,
  elapsedSeconds: number,
): GameSession {
  if (!Number.isInteger(elapsedSeconds) || elapsedSeconds < 0) {
    throw new Error("Elapsed time must be a non-negative integer.");
  }

  if (!session.isActive || elapsedSeconds === 0) return session;

  const remainingTime = Math.max(
    0,
    session.score.remainingTime - elapsedSeconds,
  );

  return {
    ...session,
    score: { ...session.score, remainingTime },
    isActive: remainingTime > 0,
  };
}
