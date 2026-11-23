import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as api from '../api';
import { Panel, PixelButton, Screen } from '../components';
import { colors, font } from '../theme';

// "TIME IS UP!" screen from Figma (Demo 6 - GAME OVER): the banner, the
// final numbers in a navy panel, and where this run landed in the Top 10.
export default function GameOverScreen({ result, player, onPlayAgain, onLeaderboard, onHome }) {
  const placement = useTop10Placement(result, player);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>TIME IS UP!</Text>
      </View>

      <Panel style={styles.panel}>
        <Text style={styles.caption}>Here is how you did</Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>FINAL SCORE</Text>
          <Text style={styles.score}>{String(result.score).padStart(4, '0')}</Text>
        </View>
        <View style={styles.statsRow}>
          <Stat label="GAMES" value={result.gamesCompleted} />
          <Stat label="BEST STREAK" value={`x${result.bestStreak}`} />
        </View>
        {placement ? <Text style={styles.placement}>{placement}</Text> : null}
      </Panel>

      <PixelButton label="PLAY AGAIN" onPress={onPlayAgain} sound={null} />
      <PixelButton label="LEADERBOARDS" variant="secondary" onPress={onLeaderboard} />
      <PixelButton label="HOME" variant="secondary" onPress={onHome} />
    </Screen>
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

// Checks whether the run just saved shows up in the global Top 10 (and the
// player's own Top 10 when logged in). The server does not return the saved
// row's id, so a run is matched by its score and games completed.
function useTop10Placement(result, player) {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const sameRun = (row) =>
      row.score === result.score &&
      row.gamesCompleted === result.gamesCompleted &&
      (player ? row.playerId === player.id : !row.playerId);

    async function check() {
      try {
        const global = await api.getLeaderboard({ limit: 10 });
        const globalRow = global.leaderboard.find(sameRun);
        if (globalRow) return `NEW TOP 10 RUN! #${globalRow.rank} GLOBAL`;
        if (!player) return null;
        const mine = await api.getLeaderboard({ limit: 10, playerId: player.id });
        const myRow = mine.leaderboard.find(sameRun);
        if (!myRow) return null;
        return myRow.rank === 1 ? 'NEW PERSONAL BEST!' : `#${myRow.rank} IN YOUR TOP 10`;
      } catch {
        return null; // The result screen still works without the check.
      }
    }

    if (result.score > 0) check().then((m) => !cancelled && setMessage(m));
    return () => {
      cancelled = true;
    };
  }, [result, player]);

  return message;
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', justifyContent: 'center' },
  banner: {
    alignSelf: 'stretch',
    borderWidth: 3,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerText: { color: colors.accent, fontFamily: font.family, fontSize: 30, fontWeight: 'bold', letterSpacing: 2 },
  panel: { alignSelf: 'stretch', alignItems: 'center', marginBottom: 20 },
  caption: { color: colors.text, fontFamily: font.family, fontSize: 12, marginBottom: 12 },
  scoreBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceDeep,
    paddingVertical: 14,
    marginBottom: 12,
  },
  scoreLabel: { color: colors.muted, fontFamily: font.family, fontWeight: 'bold', letterSpacing: 1 },
  score: { color: colors.accent, fontFamily: font.family, fontSize: 48, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', alignSelf: 'stretch' },
  stat: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceDeep,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  statLabel: { color: colors.muted, fontFamily: font.family, fontSize: 11, fontWeight: 'bold' },
  statValue: { color: colors.text, fontFamily: font.family, fontSize: 24, fontWeight: 'bold' },
  placement: { color: colors.gold, fontFamily: font.family, fontWeight: 'bold', marginTop: 14, textAlign: 'center' },
});
