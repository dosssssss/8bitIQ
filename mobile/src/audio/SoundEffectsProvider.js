import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

const SoundEffectsContext = createContext(() => {});

const SOURCES = {
  click: require('../../assets/audio/sfx/ui-click.wav'),
  toggle: require('../../assets/audio/sfx/ui-toggle.wav'),
  switch: require('../../assets/audio/sfx/ui-switch.wav'),
  danger: require('../../assets/audio/sfx/ui-danger.wav'),
  flip: require('../../assets/audio/sfx/tile-flip.wav'),
  match: require('../../assets/audio/sfx/tile-match.wav'),
  miss: require('../../assets/audio/sfx/tile-miss.wav'),
  correct: require('../../assets/audio/sfx/answer-correct.wav'),
  wrong: require('../../assets/audio/sfx/answer-wrong.wav'),
  clear: require('../../assets/audio/sfx/success-clear.wav'),
};
const PLAYER_OPTIONS = { downloadFirst: true, keepAudioSessionActive: true };

export function SoundEffectsProvider({ children }) {
  const clickPlayer = useAudioPlayer(SOURCES.click, PLAYER_OPTIONS);
  const togglePlayer = useAudioPlayer(SOURCES.toggle, PLAYER_OPTIONS);
  const switchPlayer = useAudioPlayer(SOURCES.switch, PLAYER_OPTIONS);
  const dangerPlayer = useAudioPlayer(SOURCES.danger, PLAYER_OPTIONS);
  const flipPlayer = useAudioPlayer(SOURCES.flip, PLAYER_OPTIONS);
  const matchPlayer = useAudioPlayer(SOURCES.match, PLAYER_OPTIONS);
  const missPlayer = useAudioPlayer(SOURCES.miss, PLAYER_OPTIONS);
  const correctPlayer = useAudioPlayer(SOURCES.correct, PLAYER_OPTIONS);
  const wrongPlayer = useAudioPlayer(SOURCES.wrong, PLAYER_OPTIONS);
  const clearPlayer = useAudioPlayer(SOURCES.clear, PLAYER_OPTIONS);

  const [audioModeReady, setAudioModeReady] = useState(false);
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

  const players = useMemo(() => ({
    click: clickPlayer,
    toggle: togglePlayer,
    switch: switchPlayer,
    danger: dangerPlayer,
    flip: flipPlayer,
    match: matchPlayer,
    miss: missPlayer,
    correct: correctPlayer,
    wrong: wrongPlayer,
    clear: clearPlayer,
  }), [clickPlayer, togglePlayer, switchPlayer, dangerPlayer, flipPlayer, matchPlayer, missPlayer, correctPlayer, wrongPlayer, clearPlayer]);

  useEffect(() => {
    Object.values(players).forEach((player) => {
      player.loop = false;
      player.volume = 1;
    });
  }, [players]);

  const playSfx = useCallback((name = 'click') => {
    const player = players[name];
    if (!audioModeReady || !player) return;
    if (!player.isLoaded) {
      console.warn(`[8bitIQ] Sound effect "${name}" has not loaded yet.`);
      return;
    }
    try {
      player.pause();
      player.seekTo(0)
        .then(() => player.play())
        .catch((error) => console.warn(`[8bitIQ] Could not play sound effect "${name}".`, error));
    } catch {
      console.warn(`[8bitIQ] Could not start sound effect "${name}".`);
    }
  }, [audioModeReady, players]);

  return <SoundEffectsContext.Provider value={playSfx}>{children}</SoundEffectsContext.Provider>;
}

export function useSoundEffects() {
  return useContext(SoundEffectsContext);
}
