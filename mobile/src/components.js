import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, font } from './theme';

export function PixelButton({ label, onPress, color = colors.accent, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 3,
    borderColor: colors.text,
    marginVertical: 6,
    minWidth: 200,
    alignItems: 'center',
  },
  label: {
    color: colors.background,
    fontFamily: font.family,
    fontWeight: 'bold',
    fontSize: 18,
  },
});
