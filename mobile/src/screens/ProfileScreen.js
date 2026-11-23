import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import * as api from '../api';
import { BottomNav, Panel, PixelButton, Screen, ScreenHeader, StatBox } from '../components';
import { colors, font, text } from '../theme';

// Profile ("Accounts" frame in Figma): the player card, their best numbers
// and their own Top 10 runs, plus LOG OUT.
// Without a logged-in player it shows a short sign-in form, so the profile
// works before the full login/register screens land (card 8B-1).
export default function ProfileScreen({ player, onLogin, onLogout, onNavigate }) {
  const footer = <BottomNav current="profile" onNavigate={onNavigate} />;
  if (!player) {
    return (
      <Screen scroll footer={footer}>
        <ScreenHeader title="MY ACCOUNT" subtitle="Log in to see your Top 10" />
        <SignInPanel onLogin={onLogin} />
      </Screen>
    );
  }
  return (
    <Screen scroll footer={footer}>
      <ScreenHeader title="MY ACCOUNT" subtitle="Manage your BitIQ profile" />
      <PlayerTop10 player={player} />
      <View style={{ height: 16 }} />
      <PixelButton label="↶ LOG OUT" variant="secondary" onPress={onLogout} />
    </Screen>
  );
}

function PlayerTop10({ player }) {
  const [runs, setRuns] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getLeaderboard({ limit: 10, playerId: player.id })
      .then((data) => setRuns(data.leaderboard))
      .catch((e) => setError(e.message));
  }, [player.id]);

  const best = runs && runs.length > 0 ? runs[0] : null;
  const bestStreak = runs ? Math.max(0, ...runs.map((r) => r.bestStreak || 0)) : 0;

  return (
    <>
      <Panel style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{player.username.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{player.username}</Text>
          <Text style={styles.handle}>@{player.username.toLowerCase()}</Text>
        </View>
      </Panel>

      <Panel style={styles.stats}>
        <StatBox label="BEST SCORE" value={best ? best.score : '-'} />
        <StatBox label="MOST GAMES" value={best ? best.gamesCompleted : '-'} />
        <StatBox label="BEST STREAK" value={runs ? bestStreak : '-'} />
      </Panel>

      <Panel highlight>
        <Text style={styles.listTitle}>MY TOP 10</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {!runs && !error && <ActivityIndicator color={colors.accent} />}
        {runs && runs.length === 0 && <Text style={styles.empty}>No runs yet. Press PLAY to set your first score!</Text>}
        {runs &&
          runs.map((run) => (
            <View key={run.rank} style={[styles.row, run.rank === 1 && styles.rowBest]}>
              <Text style={[styles.cell, styles.rank]}>{String(run.rank).padStart(2, '0')}</Text>
              <Text style={[styles.cell, styles.date]}>{formatDate(run.date)}</Text>
              <Text style={[styles.cell, styles.games]}>{run.gamesCompleted} games</Text>
              <Text style={[styles.cell, styles.score]}>{String(run.score).padStart(4, '0')}</Text>
            </View>
          ))}
      </Panel>
    </>
  );
}

function SignInPanel({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(action) {
    setBusy(true);
    setError(null);
    try {
      const data = await (action === 'register' ? api.register : api.login)(username.trim(), password);
      onLogin(data.user, data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <Text style={text.label}>USERNAME</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="playerone"
        placeholderTextColor={colors.muted}
      />
      <Text style={[text.label, { marginTop: 12 }]}>PASSWORD</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="8+ characters"
        placeholderTextColor={colors.muted}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <PixelButton label="LOGIN" onPress={() => submit('login')} disabled={busy} />
        <PixelButton label="SIGN UP" variant="secondary" onPress={() => submit('register')} disabled={busy} />
      </View>
    </Panel>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderWidth: 3,
    borderColor: colors.accent,
    backgroundColor: colors.pixelBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: colors.text, fontFamily: font.family, fontSize: 26, fontWeight: 'bold' },
  name: { color: colors.text, fontFamily: font.family, fontSize: 20, fontWeight: 'bold' },
  handle: { color: colors.muted, fontFamily: font.family, marginTop: 2 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  listTitle: { color: colors.accent, fontFamily: font.family, fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 6, borderRadius: 4 },
  rowBest: { backgroundColor: colors.accentDark },
  cell: { color: colors.text, fontFamily: font.family, fontSize: 13 },
  rank: { width: 34, color: colors.accent, fontWeight: 'bold' },
  date: { flex: 1 },
  games: { width: 80 },
  score: { width: 48, textAlign: 'right', fontWeight: 'bold' },
  empty: { color: colors.muted, fontFamily: font.family },
  error: { color: colors.bad, fontFamily: font.family, marginTop: 10 },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    color: colors.text,
    fontFamily: font.family,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    borderRadius: 4,
  },
});
