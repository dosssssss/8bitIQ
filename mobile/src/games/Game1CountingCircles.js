import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import GameFrame, { gameStyles, randomInt, shuffle, useFinish } from './GameFrame';
import { useSoundEffects } from '../audio/SoundEffectsProvider';

// Game 1: Counting Circles. Count the circles and pick the right number.
const COLS = 5;
const ROWS = 4;
const CIRCLE_COLORS = [colors.accent, colors.border, colors.gold, colors.orange];

function makeRound() {
  const count = randomInt(3, 10);
  // Put each circle in its own cell of a 5x4 grid so none overlap.
  const cells = shuffle([...Array(COLS * ROWS).keys()]).slice(0, count);
  const circles = cells.map((cell) => ({
    cell,
    size: randomInt(22, 34),
    color: CIRCLE_COLORS[randomInt(0, CIRCLE_COLORS.length - 1)],
    dx: randomInt(-6, 6),
    dy: randomInt(-6, 6),
  }));
  const wrong = shuffle([-3, -2, -1, 1, 2, 3].map((d) => count + d).filter((n) => n >= 1)).slice(0, 3);
  return { count, circles, options: shuffle([count, ...wrong]) };
}

export default function Game1CountingCircles({ onAnswer, disabled = false }) {
  const playSfx = useSoundEffects();
  const [round] = useState(makeRound);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const finish = useFinish('countingCircles', onAnswer, setFeedback);

  function pick(n) {
    if (disabled || selected !== null) return;
    playSfx('click');
    setSelected(n);
    finish(n === round.count);
  }

  return (
    <GameFrame title="COUNTING CIRCLES" hint="How many circles do you see?" feedback={feedback}>
      <View style={styles.board}>
        {round.circles.map((c) => {
          const col = c.cell % COLS;
          const row = Math.floor(c.cell / COLS);
          return (
            <View
              key={c.cell}
              style={[
                styles.circle,
                {
                  left: `${(col + 0.5) * (100 / COLS)}%`,
                  top: `${(row + 0.5) * (100 / ROWS)}%`,
                  width: c.size,
                  height: c.size,
                  borderRadius: c.size / 2,
                  backgroundColor: c.color,
                  transform: [{ translateX: -c.size / 2 + c.dx }, { translateY: -c.size / 2 + c.dy }],
                },
              ]}
            />
          );
        })}
      </View>
      <View style={gameStyles.grid}>
        {round.options.map((n) => {
          const isPicked = selected === n;
          const showRight = selected !== null && n === round.count;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              onPress={() => pick(n)}
              style={[gameStyles.option, showRight && gameStyles.optionCorrect, isPicked && n !== round.count && gameStyles.optionWrong]}
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
  board: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 12,
  },
  circle: { position: 'absolute' },
});
