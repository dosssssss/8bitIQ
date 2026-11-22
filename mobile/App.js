import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HowToPlayScreen from './src/screens/HowToPlayScreen';
import { colors } from './src/theme';
import MusicToggle from './src/components/MusicToggle';
import GameTransitionScreen from './src/components/GameTransitionScreen';
import { SoundEffectsProvider } from './src/audio/SoundEffectsProvider';

// Simple screen switcher:
// home -> game -> game over -> leaderboard, plus profile and how to play.
// The bottom bar on home, leaderboard, profile and how to play calls navigate().
export default function App() {
  const [screen, setScreen] = useState('home');
  const [lastResult, setLastResult] = useState(null);
  const [gameKey, setGameKey] = useState(0); // new key = fresh game
  // { id, username } after login. The login/register screens (card 8B-1)
  // and the profile screen both set it with login().
  const [player, setPlayer] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  function play() {
    setGameKey((k) => k + 1);
    setScreen('game');
    setTransitioning(true);
  }

  function navigate(next) {
    if (next === 'play') play();
    else setScreen(next);
  }

  function login(user) {
    setPlayer(user);
  }

  function logout() {
    setPlayer(null);
    setScreen('home');
  }

  let content;
  if (screen === 'game') {
    content = (
      <GameScreen
        key={gameKey}
        playerId={player?.id ?? null}
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
        player={player}
        onPlayAgain={play}
        onLeaderboard={() => setScreen('leaderboard')}
        onHome={() => setScreen('home')}
      />
    );
  } else if (screen === 'leaderboard') {
    content = <LeaderboardScreen player={player} onNavigate={navigate} />;
  } else if (screen === 'profile') {
    content = <ProfileScreen player={player} onLogin={login} onLogout={logout} onNavigate={navigate} />;
  } else if (screen === 'howToPlay') {
    content = <HowToPlayScreen onPlay={play} onNavigate={navigate} />;
  } else {
    content = <HomeScreen player={player} onPlay={play} onNavigate={navigate} />;
  }

  return (
    <SoundEffectsProvider>
      <View style={styles.app}>
        {content}
        <MusicToggle screen={screen} transitioning={transitioning} />
        {transitioning ? (
          <GameTransitionScreen
            onComplete={() => {
              setTransitioning(false);
            }}
          />
        ) : null}
        <StatusBar style="light" />
      </View>
    </SoundEffectsProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
});
