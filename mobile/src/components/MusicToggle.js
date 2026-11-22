import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors, font } from '../theme';

const MENU_MUSIC = require('../../assets/audio/adventure-loop.wav');
const GAME_MUSIC = require('../../assets/audio/gameplay-preview.wav');
const PLAY_TRANSITION = require('../../assets/audio/play-transition.wav');
const GAME_END = require('../../assets/audio/game-end.wav');

export default function MusicToggle({ screen = 'home', transitioning = false }) {
  const menuPlayer = useAudioPlayer(MENU_MUSIC);
  const gamePlayer = useAudioPlayer(GAME_MUSIC);
  const transitionPlayer = useAudioPlayer(PLAY_TRANSITION);
  const endPlayer = useAudioPlayer(GAME_END);
  const menuReady = useAudioPlayerStatus(menuPlayer).isLoaded;
  const gameReady = useAudioPlayerStatus(gamePlayer).isLoaded;
  const transitionReady = useAudioPlayerStatus(transitionPlayer).isLoaded;
  const endReady = useAudioPlayerStatus(endPlayer).isLoaded;
  const [enabled, setEnabled] = useState(true);
  const [audioModeReady, setAudioModeReady] = useState(false);
  const wasTransitioning = useRef(false);
  const previousScreen = useRef(screen);
  const endCuePending = useRef(false);

  useEffect(() => {
    menuPlayer.loop = true;
    gamePlayer.loop = true;
    transitionPlayer.loop = false;
    endPlayer.loop = false;
    menuPlayer.volume = 0.24;
    gamePlayer.volume = 0.24;
    transitionPlayer.volume = 0.3;
    endPlayer.volume = 0.34;
  }, [menuPlayer, gamePlayer, transitionPlayer, endPlayer]);

  useEffect(() => {
    let mounted = true;
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' })
      .catch(() => {})
      .finally(() => {
        if (mounted) setAudioModeReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (transitioning) {
      wasTransitioning.current = true;
      menuPlayer.pause();
      gamePlayer.pause();
      endPlayer.pause();
      if (enabled && audioModeReady && transitionReady) {
        transitionPlayer.seekTo(0);
        transitionPlayer.play();
      } else {
        transitionPlayer.pause();
      }
      return;
    }
    transitionPlayer.pause();
    if (!enabled) {
      menuPlayer.pause();
      gamePlayer.pause();
      return;
    }

    const inGameExperience = screen === 'game' || screen === 'gameOver';
    const activePlayer = inGameExperience ? gamePlayer : menuPlayer;
    const inactivePlayer = inGameExperience ? menuPlayer : gamePlayer;
    const activeReady = inGameExperience ? gameReady : menuReady;
    const justEnteredGame = screen === 'game' && wasTransitioning.current;
    wasTransitioning.current = false;
    inactivePlayer.pause();
    if (!audioModeReady || !activeReady) {
      activePlayer.pause();
      return;
    }
    if (justEnteredGame) {
      activePlayer.seekTo(0);
      const resumeTimer = setTimeout(() => {
        if (enabled) activePlayer.play();
      }, 150);
      return () => clearTimeout(resumeTimer);
    }
    activePlayer.play();
  }, [enabled, screen, transitioning, audioModeReady, menuReady, gameReady, transitionReady, menuPlayer, gamePlayer, transitionPlayer, endPlayer]);

  useEffect(() => {
    const leavingGame = previousScreen.current === 'game' && (screen === 'home' || screen === 'gameOver');
    previousScreen.current = screen;
    if (leavingGame) endCuePending.current = true;
    if (!endCuePending.current || !audioModeReady || !endReady) return;
    endCuePending.current = false;
    endPlayer.seekTo(0);
    endPlayer.play();
  }, [screen, audioModeReady, endReady, endPlayer]);

  function toggle() {
    setEnabled((current) => !current);
  }

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={`Background music ${enabled ? 'on' : 'off'}`}
      accessibilityState={{ checked: enabled }}
      onPress={toggle}
      style={({ pressed }) => [styles.button, enabled && styles.enabled, pressed && styles.pressed]}
    >
      <View style={styles.speaker}>
        <View style={styles.speakerBase} />
        <View style={styles.speakerCone} />
        <View style={[styles.soundWave, styles.waveInner, enabled && styles.waveEnabled]} />
        <View style={[styles.soundWave, styles.waveOuter, enabled && styles.waveEnabled]} />
      </View>
      <Text style={[styles.state, enabled && styles.stateEnabled]}>{enabled ? 'ON' : 'OFF'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    zIndex: 10,
    top: 52,
    right: 16,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 28,
    backgroundColor: colors.surfaceDeep,
    shadowColor: colors.border,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  enabled: { borderColor: colors.accent },
  pressed: { opacity: 0.75 },
  speaker: { width: 36, height: 30, marginTop: 2 },
  speakerBase: { position: 'absolute', left: 1, top: 10, width: 7, height: 10, backgroundColor: colors.text },
  speakerCone: {
    position: 'absolute',
    left: 7,
    top: 5,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
  },
  soundWave: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.muted,
    borderLeftColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRadius: 20,
  },
  waveInner: { left: 17, top: 8, width: 10, height: 14 },
  waveOuter: { left: 17, top: 3, width: 17, height: 24 },
  waveEnabled: { borderRightColor: colors.accent },
  state: { color: colors.muted, fontFamily: font.family, fontSize: 8, fontWeight: 'bold', letterSpacing: 1 },
  stateEnabled: { color: colors.accent },
});
