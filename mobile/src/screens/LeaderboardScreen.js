import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import * as api from '../api';
import { PixelButton } from '../components';
import { colors, font } from '../theme';

export default function LeaderboardScreen({ onBack }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getLeaderboard({ limit: 10 })
      .then((data) => setRows(data.leaderboard))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>TOP 10</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {!rows && !error && <ActivityIndicator color={colors.accent} />}
      {rows && rows.length === 0 && <Text style={styles.empty}>No runs yet. Be the first!</Text>}
      {rows && rows.length > 0 && (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.rank)}
          style={{ alignSelf: 'stretch' }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={[styles.cell, styles.rank]}>#{item.rank}</Text>
              {/* Shows playerId until login adds usernames. */}
              <Text style={[styles.cell, styles.name]} numberOfLines={1}>{item.playerId || 'Guest'}</Text>
              <Text style={styles.cell}>{item.gamesCompleted} games</Text>
              <Text style={[styles.cell, styles.score]}>{item.score}</Text>
            </View>
          )}
        />
      )}
      <PixelButton label="BACK" onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', padding: 16, paddingTop: 56 },
  title: { color: colors.accent, fontFamily: font.family, fontSize: 32, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', backgroundColor: colors.surface, padding: 12, marginBottom: 6, alignItems: 'center' },
  cell: { color: colors.text, fontFamily: font.family, marginRight: 8 },
  rank: { color: colors.accent, width: 40, fontWeight: 'bold' },
  name: { flex: 1 },
  score: { fontWeight: 'bold', minWidth: 50, textAlign: 'right' },
  empty: { color: colors.muted, fontFamily: font.family, marginVertical: 24 },
  error: { color: colors.bad, fontFamily: font.family, textAlign: 'center', marginVertical: 16 },
});
