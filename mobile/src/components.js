import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, text } from './theme';
import { useSoundEffects } from './audio/SoundEffectsProvider';

// Mint button from Figma (NEXT >, PLAY). Use variant="secondary" for the
// navy button with a cyan outline (tabs, BACK, less important actions).
export function PixelButton({ label, onPress, variant = 'primary', color, disabled = false, small = false, sound = 'click' }) {
  const playSfx = useSoundEffects();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        if (sound) playSfx(sound);
        onPress?.();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        color && { backgroundColor: color },
        { opacity: disabled ? 0.5 : pressed ? 0.8 : 1, transform: [{ translateY: pressed ? 2 : 0 }] },
      ]}
    >
      <Text style={[styles.buttonLabel, small && styles.buttonLabelSmall, !primary && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

// Navy box with a cyan outline, the main container in every Figma frame.
export function Panel({ children, style, highlight = false }) {
  return <View style={[styles.panel, highlight && styles.panelHighlight, style]}>{children}</View>;
}

// Screen title block: "Leaderboards" + "TOP GLOBAL PLAYERS IN BITIQ".
export function ScreenHeader({ title, subtitle }) {
  return (
    <View style={styles.header}>
      <Text style={text.title}>{title}</Text>
      {subtitle ? <Text style={[text.subtitle, { marginTop: 4 }]}>{subtitle.toUpperCase()}</Text> : null}
    </View>
  );
}

// Small labelled number: SCORE 0800, GAMES 8 ...
export function StatBox({ label, value, color = colors.accent, style }) {
  return (
    <View style={[styles.stat, style]}>
      <Text style={text.label}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

// Black space background with the green/blue pixel clusters and stars from
// the Figma frames. Drawn with plain Views so it needs no image files.
const PIXELS = [
  // [left %, top %, size, color]
  [4, 3, 10, 'pixelGreen'], [7, 5, 8, 'pixelBlue'], [10, 2, 10, 'pixelGreen'], [12, 6, 8, 'pixelGreen'],
  [88, 14, 10, 'pixelGreen'], [92, 16, 8, 'pixelBlue'], [95, 13, 8, 'pixelGreen'],
  [2, 26, 10, 'pixelGreen'], [6, 29, 8, 'pixelBlue'], [9, 31, 10, 'pixelGreen'],
  [65, 55, 10, 'pixelGreen'], [70, 57, 8, 'pixelBlue'], [74, 56, 10, 'pixelGreen'],
  [1, 67, 10, 'pixelGreen'], [5, 70, 8, 'pixelGreen'], [8, 72, 8, 'pixelBlue'],
  [50, 92, 10, 'pixelGreen'], [56, 90, 8, 'pixelBlue'], [62, 93, 10, 'pixelGreen'], [68, 91, 8, 'pixelGreen'],
  [90, 88, 8, 'pixelBlue'], [94, 85, 10, 'pixelGreen'],
];
const STARS = [
  [46, 5], [40, 34], [70, 71], [83, 78], [10, 93], [60, 3], [30, 60],
];

export function PixelBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PIXELS.map(([left, top, size, c], i) => (
        <View
          key={`p${i}`}
          style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, width: size, height: size, backgroundColor: colors[c], opacity: 0.8 }}
        />
      ))}
      {STARS.map(([left, top], i) => (
        <View key={`s${i}`} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, width: 4, height: 4, backgroundColor: colors.text }} />
      ))}
    </View>
  );
}

// Full-height screen with the pixel background. Set scroll for long content.
export function Screen({ children, scroll = false, footer = null, contentStyle }) {
  return (
    <View style={styles.screen}>
      <PixelBackground />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          // Without this, the first tap on a button while the keyboard is open
          // only closes the keyboard and the button never fires.
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer}
    </View>
  );
}

// Bottom navigation bar from the Figma frames: Home, Leaderboards, Account,
// and How to Play (Settings has its own card).
const TABS = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'leaderboard', label: 'Leaderboards', icon: '▤' },
  { id: 'profile', label: 'Account', icon: '◉' },
  { id: 'howToPlay', label: 'Help', icon: '?' },
];

export function BottomNav({ current, onNavigate }) {
  const playSfx = useSoundEffects();
  return (
    <View style={styles.nav}>
      {TABS.map((tab) => {
        const active = tab.id === current;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              playSfx('switch');
              onNavigate(tab.id);
            }}
            style={styles.navItem}
          >
            <Text style={[styles.navIcon, active && { color: colors.accent }]}>{tab.icon}</Text>
            <Text style={[styles.navLabel, active && { color: colors.accent }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 56 },
  // paddingRight keeps the title clear of the floating music button (56px wide, top-right).
  header: { marginBottom: 16, paddingRight: 72 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 3,
    borderRadius: 6,
    marginVertical: 6,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 14, minWidth: 0 },
  buttonPrimary: { backgroundColor: colors.accent, borderColor: colors.text },
  buttonSecondary: { backgroundColor: colors.surface, borderColor: colors.border },
  buttonLabel: {
    color: colors.surfaceDeep,
    fontFamily: font.family,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 2,
  },
  buttonLabelSmall: { fontSize: 13, letterSpacing: 1 },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 3,
    borderRadius: 10,
    padding: 16,
  },
  panelHighlight: { borderColor: colors.accent, backgroundColor: colors.surfaceDeep },
  stat: { alignItems: 'center', paddingHorizontal: 6 },
  statValue: { fontFamily: font.family, fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  nav: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    paddingTop: 10,
    paddingBottom: 24,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { color: colors.muted, fontSize: 18, fontFamily: font.family },
  navLabel: { color: colors.muted, fontSize: 10, fontFamily: font.family, marginTop: 2 },
});

// Top bar on the Game screen (Demo 2 - THE TOP BAR in Figma): score, time
// and streak in navy boxes, and a time bar that turns red under 10 seconds.
export function GameHud({ score, timeLeft, streak, maxTime = 120 }) {
  const low = timeLeft <= 10;
  const percent = Math.max(0, Math.min(1, timeLeft / maxTime));
  return (
    <View style={hud.wrap}>
      <View style={hud.row}>
        <HudBox label="SCORE" value={String(score).padStart(4, '0')} />
        <HudBox label="TIME" value={`${timeLeft}s`} color={low ? colors.bad : colors.accent} wide />
        <HudBox label="STREAK" value={`x${streak}`} />
      </View>
      <View style={hud.track}>
        <View style={[hud.fill, { width: `${percent * 100}%`, backgroundColor: low ? colors.bad : colors.accent }]} />
      </View>
    </View>
  );
}

function HudBox({ label, value, color = colors.text, wide = false }) {
  return (
    <View style={[hud.box, wide && hud.boxWide]}>
      <Text style={hud.label}>{label}</Text>
      <Text style={[hud.value, { color }]}>{value}</Text>
    </View>
  );
}

const hud = StyleSheet.create({
  wrap: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  box: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 3,
    borderRadius: 8,
    paddingVertical: 6,
    marginHorizontal: 3,
  },
  boxWide: { flex: 1.2, borderColor: colors.accent },
  label: { color: colors.muted, fontFamily: font.family, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  value: { fontFamily: font.family, fontSize: 20, fontWeight: 'bold' },
  track: {
    height: 10,
    marginTop: 8,
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
});
