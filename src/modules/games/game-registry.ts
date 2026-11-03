import type { GameId } from "../../shared/game.types";

export type GameDefinition = {
  id: GameId;
  title: string;
  description: string;
};

export const GAME_REGISTRY: Record<GameId, GameDefinition> = {
  "counting-circles": {
    id: "counting-circles",
    title: "Counting Circles",
    description: "Count the circles and choose the correct number.",
  },
  "circle-sorting": {
    id: "circle-sorting",
    title: "Circle Sorting",
    description: "Arrange circles from smallest to largest or largest to smallest.",
  },
  "emoji-match": {
    id: "emoji-match",
    title: "Emoji Match",
    description: "Find all matching emoji pairs.",
  },
  "quick-math": {
    id: "quick-math",
    title: "Quick Math",
    description: "Solve the equation by choosing the correct answer.",
  },
  "remember-pattern": {
    id: "remember-pattern",
    title: "Remember the Pattern",
    description: "Memorize the color sequence and repeat it.",
  },
};

export function getGameDefinition(gameId: GameId): GameDefinition {
  return GAME_REGISTRY[gameId];
}

export function getAllGames(): GameDefinition[] {
  return Object.values(GAME_REGISTRY);
}
