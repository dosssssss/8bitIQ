import { StyleSheet, Text, View } from 'react-native';
import { BottomNav, PixelButton, Screen } from '../components';
import { colors, font } from '../theme';

// Home screen from the Figma HOME frame: the 8BitIQ logo on the pixel space
// background, with PLAY and the other menus under it.
export default function HomeScreen({ player, onPlay, onNavigate }) {
  return (
    <Screen footer={<BottomNav current="home" onNavigate={onNavigate} />} contentStyle={styles.content}>
      <View style={styles.logoRow}>
        <Text style={styles.logo}>8it</Text>
        <Text style={[styles.logo, styles.logoI]}>I</Text>
        <Text style={styles.logo}>Q</Text>
      </View>
      <Text style={styles.subtitle}>Solve as many mini-games as you can before time runs out.</Text>
      {player ? <Text style={styles.welcome}>Welcome back, {player.username}!</Text> : null}

      <PixelButton label="PLAY" onPress={onPlay} sound={null} />
      <PixelButton label="LEADERBOARDS" variant="secondary" onPress={() => onNavigate('leaderboard')} />
      <PixelButton label="MY ACCOUNT" variant="secondary" onPress={() => onNavigate('profile')} />
      <PixelButton label="HOW TO PLAY" variant="secondary" onPress={() => onNavigate('howToPlay')} />

      <Text style={styles.invader}>👾</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end' },
  logo: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: 64,
    fontWeight: '900',
    textShadowColor: colors.pixelBlue,
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  logoI: { color: colors.accent },
  subtitle: {
    color: colors.muted,
    fontFamily: font.family,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 28,
    maxWidth: 280,
  },
  welcome: { color: colors.accent, fontFamily: font.family, fontWeight: 'bold', marginBottom: 12 },
  invader: { fontSize: 36, marginTop: 32 },
});
