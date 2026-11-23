import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as api from '../api';
import { BottomNav, Panel, PixelButton, Screen, ScreenHeader } from '../components';
import { colors, font } from '../theme';

// Leaderboards frame from Figma: a podium for the top 3 and the Top 10 list
// under it. The logged-in player's rows are highlighted in green.
export default function LeaderboardScreen({ player, onPlay, onNavigate }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getLeaderboard({ limit: 10 })
      .then((data) => setRows(data.leaderboard))
      .catch((e) => setError(e.message));
  }, []);

  const isMine = (row) => Boolean(player && row.playerId === player.id);

  return (
    <Screen scroll footer={<BottomNav current="leaderboard" onNavigate={onNavigate} />}>
      <ScreenHeader title="Leaderboards" subtitle="Top global players in BitIQ" />

      {error && <Text style={styles.error}>{error}</Text>}
      {!rows && !error && <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}
      {rows && rows.length === 0 && (
        <Panel>
          <Text style={styles.empty}>No runs yet. Be the first!</Text>
        </Panel>
      )}

      {rows && rows.length > 0 && (
        <Panel style={styles.board}>
          <Podium rows={rows} isMine={isMine} />
          <View style={styles.list}>
            <Text style={styles.listTitle}>TOP 10</Text>
            {rows.map((row) => (
              <View key={row.rank} style={[styles.row, isMine(row) && styles.rowMine]}>
                <Text style={[styles.cell, styles.rank, isMine(row) && styles.mine]}>{pad(row.rank, 2)}</Text>
                <Text style={[styles.cell, styles.name, isMine(row) && styles.mine]} numberOfLines={1}>
                  {displayName(row, isMine(row))}
                </Text>
                <Text style={[styles.cell, styles.games, isMine(row) && styles.mine]}>{row.gamesCompleted} games</Text>
                <Text style={[styles.cell, styles.score, isMine(row) && styles.mine]}>{pad(row.score, 4)}</Text>
              </View>
            ))}
          </View>
        </Panel>
      )}

      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <PixelButton label="PLAY NOW" onPress={onPlay} />
      </View>
    </Screen>
  );
}

// Top 3 as bars: 3rd on the left, 1st in the middle, 2nd on the right,
// the same order as the Figma frame.
function Podium({ rows, isMine }) {
  const places = [
    { row: rows[2], height: 70, color: colors.silver },
    { row: rows[0], height: 130, color: colors.gold },
    { row: rows[1], height: 100, color: colors.orange },
  ];
  return (
    <View style={styles.podium}>
      {places.map(({ row, height, color }, i) => (
        <View key={i} style={styles.place}>
          {row ? (
            <>
              <View style={[styles.avatar, { borderColor: row.rank === 1 ? colors.gold : row.rank === 2 ? colors.orange : colors.text }]} />
              <Text style={styles.placeName} numberOfLines={1}>{displayName(row, isMine(row))}</Text>
              <Text style={styles.placeScore}>{pad(row.score, 4)}</Text>
              <View style={[styles.bar, { height, backgroundColor: color }]} />
            </>
          ) : (
            <View style={[styles.bar, { height, backgroundColor: colors.surfaceDeep }]} />
          )}
        </View>
      ))}
    </View>
  );
}

// Guest runs (played without logging in) have no username.
function displayName(row, mine) {
  if (mine) return 'You';
  return row.username || 'Guest';
}

function pad(n, width) {
  return String(n).padStart(width, '0');
}

const styles = StyleSheet.create({
  board: { paddingTop: 20 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 20 },
  place: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  avatar: { width: 40, height: 40, borderWidth: 3, backgroundColor: colors.pixelBlue, marginBottom: 6 },
  placeName: { color: colors.text, fontFamily: font.family, fontSize: 13 },
  placeScore: { color: colors.accent, fontFamily: font.family, fontWeight: 'bold', marginBottom: 6 },
  bar: { alignSelf: 'stretch' },
  list: {
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceDeep,
    padding: 12,
  },
  listTitle: { color: colors.accent, fontFamily: font.family, fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 4 },
  rowMine: { backgroundColor: colors.accentDark },
  cell: { color: colors.text, fontFamily: font.family, fontSize: 13 },
  mine: { color: colors.accent, fontWeight: 'bold' },
  rank: { width: 34 },
  name: { flex: 1, marginRight: 6 },
  games: { width: 80 },
  score: { width: 48, textAlign: 'right' },
  empty: { color: colors.muted, fontFamily: font.family, textAlign: 'center' },
  error: { color: colors.bad, fontFamily: font.family, textAlign: 'center', marginVertical: 16 },
});
