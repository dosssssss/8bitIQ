
export interface NewResult {
  playerId: string | null;
  score: number;
  gamesCompleted: number;
  bestStreak: number;
  date: string;
}

export interface SavedResult extends NewResult {
  id: number;
  username: string | null;
}

export interface TopResultsOptions {
  limit?: number;
  playerId?: string | null;
}


