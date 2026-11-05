import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import { colors } from './src/theme';

// Simple screen switcher: home -> game -> game over -> leaderboard.
// Login/register, settings, profile and how-to-play screens plug in here.
export default function App() {
  const [screen, setScreen] = useState('home');
  const [lastResult, setLastResult] = useState(null);
  const [gameKey, setGameKey] = useState(0); // new key = fresh game
  const playerId = null; // set after login once the login card is done

  function play() {
    setGameKey((k) => k + 1);
    setScreen('game');
  }

  let content;
  if (screen === 'game') {
    content = (
      <GameScreen
        key={gameKey}
        playerId={playerId}
        onGameOver={(result) => {
          setLastResult(result);
          setScreen('gameOver');
        }}
        onQuit={() => setScreen('home')}
      />
    );
  } else if (screen === 'gameOver' && lastResult) {
    content = (
      <GameOverScreen
        result={lastResult}
        onPlayAgain={play}
        onLeaderboard={() => setScreen('leaderboard')}
        onHome={() => setScreen('home')}
      />
    );
  } else if (screen === 'leaderboard') {
    content = <LeaderboardScreen onBack={() => setScreen('home')} />;
  } else {
    content = <HomeScreen onPlay={play} onLeaderboard={() => setScreen('leaderboard')} />;
  }

  return (
    <View style={styles.app}>
      {content}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
});
