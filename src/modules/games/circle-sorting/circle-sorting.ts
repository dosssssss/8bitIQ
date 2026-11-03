export type SortDirection = "ascending" | "descending";

export type CircleSortingChallenge = {
  circles: number[];
  direction: SortDirection;
};

export function generateCircleSortingChallenge(): CircleSortingChallenge {
  const circles = new Set<number>();

  while (circles.size < 5) {
    circles.add(Math.floor(Math.random() * 90) + 10);
  }

  return {
    circles: [...circles],
    direction: Math.random() < 0.5 ? "ascending" : "descending",
  };
}

export function validateCircleSortingAnswer(
  challenge: CircleSortingChallenge,
  answer: number[],
): boolean {
  if (
    answer.length !== challenge.circles.length ||
    new Set(answer).size !== challenge.circles.length ||
    !challenge.circles.every((circle) => answer.includes(circle))
  ) {
    return false;
  }

  const expected = [...challenge.circles].sort((a, b) =>
    challenge.direction === "ascending" ? a - b : b - a,
  );

  return expected.every((circle, index) => circle === answer[index]);
}
