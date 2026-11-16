import type { SavedResult } from "./result";

export interface GameSession {
  id: string;
  playerId: string | null;
  score: number;
  gamesCompleted: number;
  streak: number;
  bestStreak: number;
  startedAt: number;
  endsAt: number;
  finished: boolean;
  finalResult: SavedResult | null;
  finishing: Promise<SavedResult> | null;
}

export interface PublicSession {
  sessionId: string;
  timeRemaining: number;
  score: number;
  gamesCompleted: number;
  streak: number;
}

export interface GameRules {
  points: number;
  seconds: number;
}
