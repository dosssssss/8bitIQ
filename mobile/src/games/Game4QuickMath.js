import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const PROBLEMS = [
  {
    expression: '19 + 3( 3 × 3 ) =',
    options: ['46', '-41', '31', '198'],
    correct: '46',
  },
  {
    expression: '9 / 2 - 3 + 9(0) =',
    options: ['-9', '-1', '1.5', '24'],
    correct: '1.5',
  },
];

export default function Game4QuickMath({ onAnswer, disabled = false }) {
  const [problemIndex, setProblemIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [lock, setLock] = useState(false);

  const current = PROBLEMS[problemIndex % PROBLEMS.length];

  function handleSelect(option) {
    if (disabled || lock) return;
    setLock(true);
    setSelected(option);

    const isCorrect = option === current.correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (onAnswer) {
      onAnswer('game4', isCorrect);
    }

    setTimeout(() => {
      setSelected(null);
      setFeedback(null);
      setLock(false);
      setProblemIndex((idx) => (idx + 1) % PROBLEMS.length);
    }, 1000);
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleBadge}>
        <Text style={styles.titleText}>QUICK MATH</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.problemBox}>
          <Text style={styles.prompt}>Can you solve this?</Text>
          <Text style={styles.equationText}>{current.expression}</Text>
          <Text style={styles.questionMark}>?</Text>
        </View>

        <View style={styles.grid}>
          {current.options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = isSelected && feedback === 'correct';
            const isWrong = isSelected && feedback === 'wrong';

            return (
              <Pressable
                key={opt}
                onPress={() => handleSelect(opt)}
                style={[
                  styles.optionBtn,
                  isCorrect && styles.btnCorrect,
                  isWrong && styles.btnWrong,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    isCorrect && styles.textCorrect,
                    isWrong && styles.textWrong,
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {feedback && (
          <Text
            style={[
              styles.feedbackText,
              feedback === 'correct' ? styles.textCorrect : styles.textWrong,
            ]}
          >
            {feedback === 'correct' ? 'CORRECT!' : 'WRONG!'}
          </Text>
        )}
      </View>

      <Text style={styles.subtext}>
        {feedback === 'wrong' ? 'Better luck next time!' : 'Calculate the math problem'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', marginVertical: 8 },
  titleBadge: {
    backgroundColor: '#020a1c',
    borderWidth: 2,
    borderColor: '#00f0ff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  titleText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  card: {
    width: '94%',
    backgroundColor: '#030b20',
    borderWidth: 2.5,
    borderColor: '#00f0ff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  problemBox: {
    width: '100%',
    backgroundColor: '#02091c',
    borderWidth: 1.5,
    borderColor: '#00f0ff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  prompt: { color: '#c7d8ee', fontFamily: 'monospace', fontSize: 12, marginBottom: 8 },
  equationText: { color: '#ffffff', fontFamily: 'monospace', fontSize: 22, fontWeight: 'bold' },
  questionMark: { color: '#ffffff', fontFamily: 'monospace', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  optionBtn: {
    width: '48%',
    backgroundColor: '#03102c',
    borderWidth: 2,
    borderColor: '#00f0ff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 5,
  },
  btnCorrect: { borderColor: '#00efa0', backgroundColor: '#02181c' },
  btnWrong: { borderColor: '#ff1a40', backgroundColor: '#1c050a' },
  optionText: { color: '#ffffff', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold' },
  textCorrect: { color: '#00efa0' },
  textWrong: { color: '#ff1a40' },
  feedbackText: { fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  subtext: { color: '#ffffff', fontFamily: 'monospace', fontSize: 11, marginTop: 10, textAlign: 'center' },
});
