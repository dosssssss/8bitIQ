import { StyleSheet, Text, View } from 'react-native';
import { PixelButton } from '../components';
import { colors, font } from '../theme';

export default function GameOverScreen({ result, onPlayAgain, onLeaderboard, onHome }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>TIME'S UP!</Text>
      <Stat label="FINAL SCORE" value={result.score} />
      <Stat label="GAMES COMPLETED" value={result.gamesCompleted} />
      <Stat label="BEST STREAK" value={result.bestStreak} />
      <View style={{ height: 24 }} />
      <PixelButton label="PLAY AGAIN" onPress={onPlayAgain} />
      <PixelButton label="LEADERBOARD" onPress={onLeaderboard} color={colors.muted} />
      <PixelButton label="HOME" onPress={onHome} color={colors.muted} />
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: colors.accent, fontFamily: font.family, fontSize: 36, fontWeight: 'bold', marginBottom: 24 },
  stat: { alignItems: 'center', marginVertical: 6 },
  statLabel: { color: colors.muted, fontFamily: font.family },
  statValue: { color: colors.text, fontFamily: font.family, fontSize: 28, fontWeight: 'bold' },
});
