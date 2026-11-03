export const GAME_TIME_CHANGE_SECONDS = 8;

export type ArcadeScore = {
  remainingTime: number;
  completedGames: number;
  currentStreak: number;
  bestStreak: number;
};

export function createInitialScore(
  startingTime = 120,
): ArcadeScore {
  if (!Number.isInteger(startingTime) || startingTime < 0) {
    throw new Error("Starting time must be a non-negative integer.");
  }

  return {
    remainingTime: startingTime,
    completedGames: 0,
    currentStreak: 0,
    bestStreak: 0,
  };
}

export function applyGameResult(
  score: ArcadeScore,
  correct: boolean,
): ArcadeScore {
  if (correct) {
    const currentStreak = score.currentStreak + 1;

    return {
      remainingTime: score.remainingTime + GAME_TIME_CHANGE_SECONDS,
      completedGames: score.completedGames + 1,
      currentStreak,
      bestStreak: Math.max(score.bestStreak, currentStreak),
    };
  }

  return {
    ...score,
    remainingTime: Math.max(0, score.remainingTime - GAME_TIME_CHANGE_SECONDS),
    currentStreak: 0,
  };
}
