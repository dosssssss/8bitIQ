import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as api from '../api';
import { PixelButton } from '../components';
import { colors, font } from '../theme';
import Game3EmojiMatch from '../games/Game3EmojiMatch';
import Game4QuickMath from '../games/Game4QuickMath';

// The game loop:
// start a session -> show a mini-game -> send the result -> repeat -> end at 0s.
// The server owns the real timer. The countdown here is only for display and
// is corrected from every server reply.
export default function GameScreen({ playerId, onGameOver, onQuit }) {
  const [session, setSession] = useState(null); // { sessionId, score, gamesCompleted, streak }
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const endingRef = useRef(false);

  const finish = useCallback(
    async (sessionId) => {
      if (endingRef.current) return;
      endingRef.current = true;
      try {
        const result = await api.endGame(sessionId);
        onGameOver(result);
      } catch (e) {
        if (e.status === 409 && e.data?.timeRemaining) {
          // The server still has time left (we lagged). Resync and keep playing.
          setTimeLeft(e.data.timeRemaining);
          endingRef.current = false;
        } else {
          setError(e.message);
        }
      }
    },
    [onGameOver],
  );

  // Start a new session when the screen opens.
  useEffect(() => {
    let cancelled = false;
    api
      .startGame(playerId)
      .then((data) => {
        if (cancelled) return;
        setSession(data);
        setTimeLeft(data.timeRemaining);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  // Display countdown.
  useEffect(() => {
    if (!session) return undefined;
    if (timeLeft <= 0) {
      finish(session.sessionId);
      return undefined;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [session, timeLeft, finish]);

  // Called by a mini-game when the player answers.
  async function handleResult(game, success) {
    if (!session || busy) return;
    setBusy(true);
    try {
      const data = await api.sendResult(session.sessionId, game, success);
      setSession((s) => ({ ...s, ...data }));
      setTimeLeft(data.timeRemaining);
      if (data.gameOver) await finish(session.sessionId);
    } catch (e) {
      if (e.data?.gameOver) await finish(session.sessionId);
      else setError(e.message);
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

  if (!session) {
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
        <Text style={[styles.hudText, timeLeft <= 10 && { color: colors.bad }]}>TIME {timeLeft}s</Text>
        <Text style={styles.hudText}>STREAK {session.streak}</Text>
      </View>

      {/* Mini-game area: switches between Game 3 and Game 4 */}
      <View style={styles.gameArea}>
        {session.gamesCompleted % 2 === 0 ? (
          <Game3EmojiMatch onAnswer={handleResult} disabled={busy} />
        ) : (
          <Game4QuickMath onAnswer={handleResult} disabled={busy} />
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
