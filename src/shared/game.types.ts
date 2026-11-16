export type GameId =
  | "counting-circles"
  | "circle-sorting"
  | "emoji-match"
  | "quick-math"
  | "remember-pattern";

export type GameResult = {
  gameId: GameId;
  correct: boolean;
  points: number;
};
