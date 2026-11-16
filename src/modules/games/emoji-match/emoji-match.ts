export type EmojiTile = {
  id: number;
  emoji: string;
};

export type EmojiMatchChallenge = {
  tiles: EmojiTile[];
  totalPairs: number;
};

export type EmojiMatchState = {
  tiles: (EmojiTile & {
    isFaceUp: boolean;
    isMatched: boolean;
  })[];
  selectedTileIds: number[];
  matchedPairs: number;
  attempts: number;
  status: "playing" | "completed";
};

const EMOJIS = ["🍎", "🚀", "🐱", "🌈", "⚽", "🎸", "🍕", "🦋"];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }

  return result;
}

export function generateEmojiMatchChallenge(): EmojiMatchChallenge {
  const selected = shuffle(EMOJIS).slice(0, 8);

  const tiles = shuffle([...selected, ...selected]).map((emoji, id) => ({
    id,
    emoji,
  }));

  return { tiles, totalPairs: selected.length };
}

export function createEmojiMatchState(
  challenge: EmojiMatchChallenge,
): EmojiMatchState {
  return {
    tiles: challenge.tiles.map((tile) => ({
      ...tile,
      isFaceUp: false,
      isMatched: false,
    })),
    selectedTileIds: [],
    matchedPairs: 0,
    attempts: 0,
    status: "playing",
  };
}

export function revealEmojiTile(
  state: EmojiMatchState,
  tileId: number,
): EmojiMatchState {
  if (state.status === "completed" || state.selectedTileIds.length >= 2) {
    return state;
  }

  const tile = state.tiles.find((item) => item.id === tileId);

  if (!tile || tile.isMatched || tile.isFaceUp) {
    return state;
  }

  const tiles = state.tiles.map((item) =>
    item.id === tileId ? { ...item, isFaceUp: true } : item,
  );

  const selectedTileIds = [...state.selectedTileIds, tileId];

  if (selectedTileIds.length < 2) {
    return { ...state, tiles, selectedTileIds };
  }

  const first = tiles.find((item) => item.id === selectedTileIds[0])!;
  const second = tiles.find((item) => item.id === selectedTileIds[1])!;

  const attempts = state.attempts + 1;

  if (first.emoji !== second.emoji) {
    return { ...state, tiles, selectedTileIds, attempts };
  }

  const matchedTiles = tiles.map((item) =>
    selectedTileIds.includes(item.id)
      ? { ...item, isMatched: true }
      : item,
  );

  const matchedPairs = state.matchedPairs + 1;

  return {
    ...state,
    tiles: matchedTiles,
    selectedTileIds: [],
    matchedPairs,
    attempts,
    status:
      matchedPairs === 8 ? "completed" : "playing",
  };
}

export function hideEmojiMismatch(
  state: EmojiMatchState,
): EmojiMatchState {
  if (state.selectedTileIds.length !== 2) return state;

  return {
    ...state,
    tiles: state.tiles.map((tile) =>
      state.selectedTileIds.includes(tile.id)
        ? { ...tile, isFaceUp: false }
        : tile,
    ),
    selectedTileIds: [],
  };
}

export function validateEmojiMatch(
  challenge: EmojiMatchChallenge,
  firstTileId: number,
  secondTileId: number,
): boolean {
  if (firstTileId === secondTileId) return false;

  const first = challenge.tiles.find((tile) => tile.id === firstTileId);
  const second = challenge.tiles.find((tile) => tile.id === secondTileId);

  return Boolean(first && second && first.emoji === second.emoji);
}
