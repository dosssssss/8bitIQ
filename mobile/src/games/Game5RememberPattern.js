import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../theme';
import GameFrame, { randomInt, useFinish } from './GameFrame';

// Game 5: Remember the Pattern. Watch the pads light up, then tap them in
// the same order. One wrong tap ends the round.
const PADS = [
  { id: 'red', color: '#FF5A6E', dim: '#4A1820' },
  { id: 'blue', color: '#3D8BFF', dim: '#14284A' },
  { id: 'green', color: '#1EE89A', dim: '#0B4430' },
  { id: 'yellow', color: '#FFD25C', dim: '#4A3D18' },
];
const SHOW_MS = 550;
const GAP_MS = 200;

function makeSequence() {
  const length = randomInt(3, 4);
  return Array.from({ length }, () => PADS[randomInt(0, PADS.length - 1)].id);
}

export default function Game5RememberPattern({ onAnswer, disabled = false }) {
  const [sequence] = useState(makeSequence);
  const [lit, setLit] = useState(null); // pad currently lit
  const [watching, setWatching] = useState(true);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const finish = useFinish('rememberPattern', onAnswer, setFeedback);

  // Play the pattern once when the round starts.
  useEffect(() => {
    const timers = [];
    sequence.forEach((pad, i) => {
      const start = 600 + i * (SHOW_MS + GAP_MS);
      timers.push(setTimeout(() => setLit(pad), start));
      timers.push(setTimeout(() => setLit(null), start + SHOW_MS));
    });
    timers.push(setTimeout(() => setWatching(false), 600 + sequence.length * (SHOW_MS + GAP_MS)));
    return () => timers.forEach(clearTimeout);
  }, [sequence]);

  function tap(pad) {
    if (disabled || watching || feedback) return;
    setLit(pad);
    setTimeout(() => setLit((p) => (p === pad ? null : p)), 200);
    if (pad !== sequence[step]) {
      finish(false);
      return;
    }
    if (step + 1 === sequence.length) finish(true);
    else setStep(step + 1);
  }

  return (
    <GameFrame
      title="REMEMBER THE PATTERN"
      hint={watching ? 'Watch closely...' : 'Now tap the same pattern!'}
      feedback={feedback}
    >
      <Text style={styles.status}>
        {watching ? 'WATCH' : `YOUR TURN  ${step}/${sequence.length}`}
      </Text>
      <View style={styles.pads}>
        {PADS.map((pad) => (
          <Pressable
            key={pad.id}
            accessibilityRole="button"
            accessibilityLabel={pad.id}
            onPress={() => tap(pad.id)}
            style={[styles.pad, { backgroundColor: lit === pad.id ? pad.color : pad.dim, borderColor: pad.color }]}
          />
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  status: { color: colors.accent, fontFamily: font.family, fontWeight: 'bold', fontSize: 14, marginBottom: 12, letterSpacing: 1 },
  pads: { width: 240, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  pad: { width: 112, height: 112, borderRadius: 12, borderWidth: 3, marginBottom: 16 },
});
