import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../theme';
import GameFrame, { gameStyles, randomInt, shuffle, useFinish } from './GameFrame';
import { useSoundEffects } from '../audio/SoundEffectsProvider';

// Game 2: Circle Sorting. Tap the numbered circles from smallest to biggest
// (or biggest to smallest). One wrong tap ends the round.
function makeRound() {
  const numbers = new Set();
  while (numbers.size < 5) numbers.add(randomInt(1, 50));
  const ascending = Math.random() < 0.5;
  const order = [...numbers].sort((a, b) => (ascending ? a - b : b - a));
  return { circles: shuffle([...numbers]), order, ascending };
}

export default function Game2CircleSorting({ onAnswer, disabled = false }) {
  const playSfx = useSoundEffects();
  const [round] = useState(makeRound);
  const [tapped, setTapped] = useState([]);
  const [wrongTap, setWrongTap] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const finish = useFinish('circleSorting', onAnswer, setFeedback);

  function tap(n) {
    if (disabled || feedback || tapped.includes(n)) return;
    playSfx('click');
    if (n !== round.order[tapped.length]) {
      setWrongTap(n);
      finish(false);
      return;
    }
    const next = [...tapped, n];
    setTapped(next);
    if (next.length === round.order.length) finish(true);
  }

  return (
    <GameFrame
      title="CIRCLE SORTING"
      hint="Tap the circles in order. One wrong tap ends it!"
      feedback={feedback}
    >
      <Text style={gameStyles.prompt}>{round.ascending ? 'SMALLEST ➜ BIGGEST' : 'BIGGEST ➜ SMALLEST'}</Text>
      <View style={styles.slots}>
        {round.order.map((_, i) => (
          <View key={i} style={[styles.slot, tapped[i] !== undefined && styles.slotFilled]}>
            <Text style={styles.slotText}>{tapped[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <View style={styles.circles}>
        {round.circles.map((n) => {
          const done = tapped.includes(n);
          const wrong = wrongTap === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              onPress={() => tap(n)}
              style={[styles.circle, done && styles.circleDone, wrong && styles.circleWrong]}
            >
              <Text style={[styles.circleText, done && { color: colors.muted }]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  slots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18 },
  slot: {
    width: 46,
    height: 40,
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: colors.borderSoft,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceDeep,
  },
  slotFilled: { borderColor: colors.good },
  slotText: { color: colors.good, fontFamily: font.family, fontWeight: 'bold', fontSize: 16 },
  circles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    margin: 8,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { borderColor: colors.accentDark, backgroundColor: colors.surfaceDeep },
  circleWrong: { borderColor: colors.bad, backgroundColor: '#1c050a' },
  circleText: { color: colors.text, fontFamily: font.family, fontWeight: 'bold', fontSize: 20 },
});
