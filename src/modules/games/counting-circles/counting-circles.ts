export type CountingChallenge = {
  circleCount: number;
  choices: number[];
};

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function generateCountingChallenge(): CountingChallenge {
  const circleCount = Math.floor(Math.random() * 15) + 1;

  const otherChoices = Array.from(
    { length: 15 },
    (_, index) => index + 1,
  ).filter((number) => number !== circleCount);

  const choices = shuffle([
    circleCount,
    ...shuffle(otherChoices).slice(0, 3),
  ]);

  return { circleCount, choices };
}

export function validateCountingAnswer(
  challenge: CountingChallenge,
  answer: number,
): boolean {
  return answer === challenge.circleCount;
}
