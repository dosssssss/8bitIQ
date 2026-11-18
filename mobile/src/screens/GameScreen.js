import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as api from '../api';
import { PixelButton } from '../components';
import { colors, font } from '../theme';
import Game3EmojiMatch from '../games/Game3EmojiMatch';
import Game4QuickMath from '../games/Game4QuickMath';

export default function GameScreen({ playerId, onGameOver, onQuit }) {
  const [session, setSession] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [gameId, setGameId] = useState('emoji-match');

  const finish = useCallback(async (id) => {
    try {
      const result = await api.endGame(id);
      onGameOver(result);
    } catch (e) {
      setError(e.message);
    }
  }, [onGameOver]);

  const loadChallenge = useCallback(async (id, nextGame) => {
    const data = await api.getGameChallenge(id, nextGame);
    setGameId(nextGame);
    setChallenge(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const data = await api.startGame(playerId);
        if (cancelled) return;
        setSession(data);
        setTimeLeft(data.timeRemaining);
        const first = await api.getGameChallenge(data.sessionId, 'emoji-match');
        if (!cancelled) setChallenge(first);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    }

    start();
    return () => { cancelled = true; };
  }, [playerId]);

  useEffect(() => {
    if (!session || timeLeft <= 0) {
      if (session && timeLeft <= 0) finish(session.sessionId);
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [session, timeLeft, finish]);

  async function submitAnswer(answer) {
    if (!session || !challenge || busy) return null;

    setBusy(true);
    try {
      const result = await api.submitGameAnswer(
        session.sessionId,
        challenge.challengeId,
        answer,
      );

      setSession((old) => ({ ...old, ...result }));
      if (result.timeRemaining !== undefined) setTimeLeft(result.timeRemaining);

      if (result.gameOver) {
        await finish(session.sessionId);
      } else if (result.completed) {
        const next = gameId === 'emoji-match' ? 'quick-math' : 'emoji-match';
        await loadChallenge(session.sessionId, next);
      }

      return result;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <PixelButton label="BACK" onPress={onQuit} />
      </View>
    );
  }

  if (!session || !challenge) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hud}>
        <Text style={styles.hudText}>SCORE {session.score}</Text>
        <Text style={[styles.hudText, timeLeft <= 10 && { color: colors.bad }]}>
          TIME {timeLeft}s
        </Text>
        <Text style={styles.hudText}>STREAK {session.streak}</Text>
      </View>

      <View style={styles.gameArea}>
        {gameId === 'emoji-match' ? (
          <Game3EmojiMatch
            challenge={challenge.challenge}
            onPairAnswer={submitAnswer}
            disabled={busy}
          />
        ) : (
          <Game4QuickMath
            challenge={challenge.challenge}
            onAnswer={submitAnswer}
            disabled={busy}
          />
        )}
      </View>

      <Text style={styles.games}>Games completed: {session.gamesCompleted}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, paddingTop: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hud: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderColor: colors.surface, paddingBottom: 12 },
  hudText: { color: colors.text, fontFamily: font.family, fontWeight: 'bold', fontSize: 16 },
  gameArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  games: { color: colors.muted, fontFamily: font.family, textAlign: 'center' },
  error: { color: colors.bad, fontFamily: font.family, textAlign: 'center', marginBottom: 16 },
});
