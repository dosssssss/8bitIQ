import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../theme';

// Shared layout for every mini-game, from the Figma game frames:
// a title badge, a navy card with a cyan outline, and a hint line.
// feedback is null, 'correct' or 'wrong'.
export default function GameFrame({ title, hint, feedback, children }) {
  return (
    <View style={styles.container}>
      <View style={styles.titleBadge}>
        <Text style={styles.titleText}>{title}</Text>
      </View>
      <View style={styles.card}>{children}</View>
      {feedback ? (
        <Text style={[styles.feedback, { color: feedback === 'correct' ? colors.good : colors.bad }]}>
          {feedback === 'correct' ? 'CORRECT!' : 'WRONG!'}
        </Text>
      ) : (
        <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
}

// How long CORRECT!/WRONG! stays on screen before the next game.
export const FEEDBACK_MS = 800;

// Shows the feedback, then reports the result once. Returns finish(success).
export function useFinish(gameId, onAnswer, setFeedback) {
  const done = useRef(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return function finish(success) {
    if (done.current) return;
    done.current = true;
    setFeedback(success ? 'correct' : 'wrong');
    timer.current = setTimeout(() => onAnswer && onAnswer(gameId, success), FEEDBACK_MS);
  };
}

export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const gameStyles = StyleSheet.create({
  prompt: { color: colors.muted, fontFamily: font.family, fontSize: 12, textAlign: 'center', marginBottom: 10 },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  option: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 5,
  },
  optionCorrect: { borderColor: colors.good, backgroundColor: '#02181c' },
  optionWrong: { borderColor: colors.bad, backgroundColor: '#1c050a' },
  optionText: { color: colors.text, fontFamily: font.family, fontSize: 20, fontWeight: 'bold' },
});

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', marginVertical: 8 },
  titleBadge: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  titleText: { color: colors.text, fontFamily: font.family, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  card: {
    width: '94%',
    backgroundColor: '#030b20',
    borderWidth: 2.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  hint: { color: colors.text, fontFamily: font.family, fontSize: 11, marginTop: 10, textAlign: 'center' },
  feedback: { fontFamily: font.family, fontSize: 18, fontWeight: 'bold', marginTop: 8, letterSpacing: 2 },
});
