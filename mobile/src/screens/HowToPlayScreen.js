import { StyleSheet, Text, View } from 'react-native';
import { BottomNav, Panel, PixelButton, Screen, ScreenHeader } from '../components';
import { colors, font } from '../theme';

// How to Play, following the Help / How to Play / Demo 1-6 frames in Figma.
// Points and seconds match RULES in backend/services/sessionService.js.
const STEPS = [
  { title: 'START A RUN', body: 'Press PLAY. You get 120 seconds on the clock.' },
  { title: 'THE TOP BAR', body: 'Your score, the time left and your streak stay at the top of the screen.' },
  { title: 'SOLVE IT', body: 'One of the 5 mini-games appears at random. Solve it fast.' },
  { title: 'WIN OR MISS', body: 'Correct: +100 points and +5 seconds.\nWrong: -50 points, -5 seconds and your streak resets.' },
  { title: 'KEEP GOING', body: 'The next mini-game starts right away. Chain wins to build your streak.' },
  { title: 'GAME OVER', body: 'At 0 seconds the run ends and your score is saved. Beat the Top 10!' },
];

const GAMES = [
  { name: 'Counting Circles', body: 'Count the circles and tap the right number.' },
  { name: 'Circle Sorting', body: 'Tap the numbered circles in order. One wrong tap ends the round.' },
  { name: 'Emoji Match', body: 'Flip the tiles and find all 8 pairs. 5 misses and the round is lost.' },
  { name: 'Quick Math', body: 'Solve a quick sum and tap the right answer.' },
  { name: 'Remember the Pattern', body: 'Watch the colors light up, then tap them in the same order.' },
];

const FAQ = [
  { q: 'Do I need an account?', a: 'No, guests can play. Log in to keep your own Top 10.' },
  { q: 'How is the leaderboard ranked?', a: 'Most games completed first, then the highest score, then whoever got there first.' },
];

export default function HowToPlayScreen({ onPlay, onNavigate }) {
  return (
    <Screen scroll footer={<BottomNav current="howToPlay" onNavigate={onNavigate} />}>
      <ScreenHeader title="How to Play" subtitle="Beat the clock, climb the Top 10" />

      {STEPS.map((step, i) => (
        <Panel key={step.title} style={styles.step}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.body}>{step.body}</Text>
          </View>
        </Panel>
      ))}

      <Text style={styles.section}>THE GAMES</Text>
      <Panel highlight>
        {GAMES.map((game) => (
          <View key={game.name} style={styles.game}>
            <Text style={styles.gameName}>▸ {game.name}</Text>
            <Text style={styles.body}>{game.body}</Text>
          </View>
        ))}
      </Panel>

      <Text style={styles.section}>FAQ</Text>
      <Panel>
        {FAQ.map((item) => (
          <View key={item.q} style={styles.game}>
            <Text style={styles.gameName}>{item.q}</Text>
            <Text style={styles.body}>{item.a}</Text>
          </View>
        ))}
      </Panel>

      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <PixelButton label="PLAY NOW" onPress={onPlay} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, padding: 12 },
  badge: {
    width: 32,
    height: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 4,
  },
  badgeText: { color: colors.surfaceDeep, fontFamily: font.family, fontWeight: 'bold', fontSize: 16 },
  stepTitle: { color: colors.accent, fontFamily: font.family, fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  body: { color: colors.text, fontFamily: font.family, fontSize: 13, lineHeight: 19 },
  section: { color: colors.border, fontFamily: font.family, fontWeight: 'bold', fontSize: 16, marginTop: 18, marginBottom: 8 },
  game: { marginBottom: 10 },
  gameName: { color: colors.accent, fontFamily: font.family, fontWeight: 'bold', marginBottom: 2 },
});
