export type PatternColor = "red" | "blue" | "green" | "yellow";

export type PatternChallenge = {
  sequence: PatternColor[];
};

export type PatternGameState = {
  currentIndex: number;
  status: "playing" | "completed" | "failed";
};

const COLORS: PatternColor[] = ["red", "blue", "green", "yellow"];

export function generatePatternChallenge(
  length = 4,
): PatternChallenge {
  if (!Number.isInteger(length) || length < 1 || length > 30) {
    throw new Error("Pattern length must be between 1 and 30.");
  }

  return {
    sequence: Array.from(
      { length },
      () => COLORS[Math.floor(Math.random() * COLORS.length)]!,
    ),
  };
}

export function createPatternGameState(): PatternGameState {
  return { currentIndex: 0, status: "playing" };
}

export function submitPatternColor(
  challenge: PatternChallenge,
  state: PatternGameState,
  answer: PatternColor,
): PatternGameState {
  if (state.status !== "playing") return state;

  if (challenge.sequence[state.currentIndex] !== answer) {
    return { ...state, status: "failed" };
  }

  const nextIndex = state.currentIndex + 1;

  return {
    currentIndex: nextIndex,
    status: nextIndex === challenge.sequence.length
      ? "completed"
      : "playing",
  };
}

export function validatePatternAnswer(
  challenge: PatternChallenge,
  answer: PatternColor[],
): boolean {
  return (
    answer.length === challenge.sequence.length &&
    challenge.sequence.every((color, index) => color === answer[index])
  );
}
