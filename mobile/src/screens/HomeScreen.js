import { StyleSheet, Text, View } from 'react-native';
import { PixelButton } from '../components';
import { colors, font } from '../theme';

// Placeholder home screen. The login/register cards will add the real
// sign-in flow from Figma here.
export default function HomeScreen({ onPlay, onLeaderboard }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>8bitIQ</Text>
      <Text style={styles.subtitle}>Solve as many mini-games as you can before time runs out.</Text>
      <PixelButton label="PLAY" onPress={onPlay} />
      <PixelButton label="LEADERBOARD" onPress={onLeaderboard} color={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { color: colors.accent, fontFamily: font.family, fontSize: 48, fontWeight: 'bold', letterSpacing: 4 },
  subtitle: { color: colors.muted, fontFamily: font.family, textAlign: 'center', marginVertical: 24 },
});
