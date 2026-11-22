import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as api from '../api';
import { GameHud, PixelBackground, PixelButton } from '../components';
import { colors, font } from '../theme';
import Game1CountingCircles from '../games/Game1CountingCircles';
import Game2CircleSorting from '../games/Game2CircleSorting';
import Game3EmojiMatch from '../games/Game3EmojiMatch';
import Game4QuickMath from '../games/Game4QuickMath';
import Game5RememberPattern from '../games/Game5RememberPattern';

// The 5 mini-games. Each one reports one result per round with
// onAnswer(gameId, success), then the next game is picked at random.
const GAMES = [Game1CountingCircles, Game2CircleSorting, Game3EmojiMatch, Game4QuickMath, Game5RememberPattern];

// A random game index, never the same game twice in a row.
function pickNextGame(previous) {
  let next = Math.floor(Math.random() * GAMES.length);
  if (next === previous) next = (next + 1) % GAMES.length;
  return next;
}

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
  const [round, setRound] = useState(0); // remounts the mini-game each round
  const [gameIndex, setGameIndex] = useState(() => pickNextGame(-1));

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

  async function cancelRun() {
    if (!session) {
      onQuit();
      return;
    }
    if (endingRef.current || busy) return;
    endingRef.current = true;
    setBusy(true);
    try {
      await api.cancelGame(session.sessionId);
      onQuit();
    } catch (e) {
      endingRef.current = false;
      setBusy(false);
      if (e.status === 409 && e.data?.gameOver) {
        await finish(session.sessionId);
      } else {
        setError(e.message);
      }
    }
  }

  function requestExit() {
    if (!session) {
      onQuit();
      return;
    }
    if (busy) return;
    Alert.alert('END THIS RUN?', 'Leaving now will discard this run. It will not be saved or count on the leaderboard.', [
      { text: 'KEEP PLAYING', style: 'cancel' },
      { text: 'LEAVE GAME', style: 'destructive', onPress: cancelRun },
    ]);
  }

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
    if (!session || busy || endingRef.current) return;
    setBusy(true);
    try {
      const data = await api.sendResult(session.sessionId, game, success);
      setSession((s) => ({ ...s, ...data }));
      setTimeLeft(data.timeRemaining);
      if (data.gameOver) await finish(session.sessionId);
      else {
        setGameIndex((prev) => pickNextGame(prev));
        setRound((r) => r + 1);
      }
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
        <PixelButton label="BACK" onPress={requestExit} />
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

  const CurrentGame = GAMES[gameIndex];
  return (
    <View style={styles.screen}>
      <PixelBackground />
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" onPress={requestExit} hitSlop={12} disabled={busy}>
          <Text style={styles.exit}>✕ Exit</Text>
        </Pressable>
        <Text style={styles.games}>ROUND {round + 1}</Text>
      </View>
      <GameHud score={session.score} timeLeft={timeLeft} streak={session.streak} />

      {/* Mini-game area: a new random game every round */}
      <View style={styles.gameArea}>
        <CurrentGame key={round} onAnswer={handleResult} disabled={busy} />
      </View>

      <Text style={styles.completed}>Games completed: {session.gamesCompleted}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, paddingTop: 112, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 3 },
  exit: { color: colors.accent, fontFamily: font.family, fontWeight: 'bold' },
  games: { color: colors.text, fontFamily: font.family, fontWeight: 'bold', letterSpacing: 1 },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceDeep,
    borderColor: colors.border,
    borderWidth: 3,
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
  },
  completed: { color: colors.muted, fontFamily: font.family, textAlign: 'center', marginBottom: 12 },
  error: { color: colors.bad, fontFamily: font.family, textAlign: 'center', marginBottom: 16 },
});
