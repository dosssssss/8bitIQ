export type MathOperator = "+" | "-" | "*";

export type QuickMathChallenge = {
  firstNumber: number;
  secondNumber: number;
  operator: MathOperator;
  correctAnswer: number;
  choices: number[];
};

export function generateQuickMathChallenge(): QuickMathChallenge {
  const firstNumber = Math.floor(Math.random() * 20) + 1;
  const secondNumber = Math.floor(Math.random() * 10) + 1;
  const operators: MathOperator[] = ["+", "-", "*"];
  const operator = operators[Math.floor(Math.random() * operators.length)]!;

  const correctAnswer =
    operator === "+"
      ? firstNumber + secondNumber
      : operator === "-"
        ? firstNumber - secondNumber
        : firstNumber * secondNumber;

  const choices = new Set<number>([correctAnswer]);

  while (choices.size < 4) {
    choices.add(correctAnswer + Math.floor(Math.random() * 21) - 10);
  }

  return {
    firstNumber,
    secondNumber,
    operator,
    correctAnswer,
    choices: [...choices].sort(() => Math.random() - 0.5),
  };
}

export function validateMathAnswer(
  challenge: QuickMathChallenge,
  answer: number,
): boolean {
  return answer === challenge.correctAnswer;
}
