import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../theme';
import GameFrame, { gameStyles, randomInt, shuffle, useFinish } from './GameFrame';

// Game 4: Quick Math. Easy for now: one addition or subtraction with
// numbers up to 10, and the answer is never negative.
function makeProblem() {
  let a = randomInt(1, 10);
  let b = randomInt(1, 10);
  const plus = Math.random() < 0.5;
  if (!plus && b > a) [a, b] = [b, a];
  const answer = plus ? a + b : a - b;
  const wrong = new Set();
  while (wrong.size < 3) {
    const n = answer + randomInt(-3, 3);
    if (n !== answer && n >= 0) wrong.add(n);
  }
  return { expression: `${a} ${plus ? '+' : '-'} ${b} =`, answer, options: shuffle([answer, ...wrong]) };
}

export default function Game4QuickMath({ onAnswer, disabled = false }) {
  const [problem] = useState(makeProblem);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const finish = useFinish('quickMath', onAnswer, setFeedback);

  function pick(n) {
    if (disabled || selected !== null) return;
    setSelected(n);
    finish(n === problem.answer);
  }

  return (
    <GameFrame title="QUICK MATH" hint="Solve it as fast as you can" feedback={feedback}>
      <View style={styles.problemBox}>
        <Text style={gameStyles.prompt}>Can you solve this?</Text>
        <Text style={styles.equation}>{problem.expression} ?</Text>
      </View>
      <View style={gameStyles.grid}>
        {problem.options.map((n) => {
          const isPicked = selected === n;
          const showRight = selected !== null && n === problem.answer;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              onPress={() => pick(n)}
              style={[gameStyles.option, showRight && gameStyles.optionCorrect, isPicked && n !== problem.answer && gameStyles.optionWrong]}
            >
              <Text style={gameStyles.optionText}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  problemBox: {
    width: '100%',
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  equation: { color: colors.text, fontFamily: font.family, fontSize: 34, fontWeight: 'bold' },
});
