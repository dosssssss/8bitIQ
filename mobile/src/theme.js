import { Platform } from 'react-native';

// Colors and text styles taken from the 8BITIQ Figma file
// (Leaderboards, Home and Game frames): black space background, navy
// panels with a cyan outline, mint green for actions and highlights.
export const colors = {
  background: '#000000',
  surface: '#0B1440', // navy panel
  surfaceDeep: '#060C2A', // inner panel / list background
  border: '#22C3F0', // cyan outline around panels and tabs
  borderSoft: '#1A6E9E',
  text: '#F4F7FF',
  muted: '#8FA3D9',
  accent: '#1EE89A', // mint green: buttons, scores, highlights
  accentDark: '#0B5E45',
  gold: '#FFD25C', // 1st place
  orange: '#FF9F4A', // 2nd place
  silver: '#D4E6F2', // 3rd place
  good: '#1EE89A',
  bad: '#FF5A6E',
  pixelGreen: '#1F9D55',
  pixelBlue: '#1C2E7A',
};

export const font = {
  // A monospace font keeps the 8-bit look without adding a font package.
  family: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

// Shared text styles.
export const text = {
  title: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.border,
    fontFamily: font.family,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  label: {
    color: colors.muted,
    fontFamily: font.family,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  body: {
    color: colors.text,
    fontFamily: font.family,
    fontSize: 14,
  },
};
