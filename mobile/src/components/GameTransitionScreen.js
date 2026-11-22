import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../theme';

export default function GameTransitionScreen({ onComplete }) {
  const visibleHeight = useRef(new Animated.Value(1)).current;
  const visibleWidth = useRef(new Animated.Value(1)).current;
  const animationRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Keep a stalled native modal or animation from trapping the player.
    const failsafe = setTimeout(() => onCompleteRef.current(), 2200);
    return () => {
      clearTimeout(failsafe);
      animationRef.current?.stop();
    };
  }, []);

  function startAnimation() {
    if (animationRef.current) return;
    const animation = Animated.sequence([
      // CRT off: close vertically to a bright line, then horizontally to a dot.
      Animated.timing(visibleHeight, {
        toValue: 0.035,
        duration: 320,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(visibleWidth, {
        toValue: 0.025,
        duration: 210,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(100),
      // CRT on: grow the dot back into a line, then reveal the whole game.
      Animated.timing(visibleWidth, {
        toValue: 1,
        duration: 210,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(visibleHeight, {
        toValue: 1,
        duration: 450,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);
    animationRef.current = animation;
    animation.start(({ finished }) => {
      animationRef.current = null;
      if (finished) onCompleteRef.current();
    });
  }

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const verticalBars = visibleHeight.interpolate({ inputRange: [0, 1], outputRange: [halfHeight, 0] });
  const horizontalBars = visibleWidth.interpolate({ inputRange: [0, 1], outputRange: [halfWidth, 0] });
  const scanlineOpacity = visibleHeight.interpolate({
    inputRange: [0.025, 0.05, 0.16, 0.4, 1],
    outputRange: [1, 1, 1, 0, 0],
  });
  const pixelOpacity = visibleWidth.interpolate({ inputRange: [0.025, 0.06, 0.2, 1], outputRange: [1, 1, 0, 0] });

  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onShow={startAnimation}
      onRequestClose={() => onCompleteRef.current()}
    >
      <View pointerEvents="auto" style={styles.overlay}>
        <>
          <Animated.View style={[styles.edge, styles.top, { height: verticalBars }]} />
          <Animated.View style={[styles.edge, styles.bottom, { height: verticalBars }]} />
          <Animated.View style={[styles.edge, styles.left, { width: horizontalBars }]} />
          <Animated.View style={[styles.edge, styles.right, { width: horizontalBars }]} />
          <Animated.View style={[styles.scanline, { width, opacity: scanlineOpacity, transform: [{ scaleX: visibleWidth }] }]} />
          <Animated.View style={[styles.centerPixel, { opacity: pixelOpacity }]} />
        </>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, zIndex: 999, elevation: 999, backgroundColor: 'transparent', overflow: 'hidden' },
  edge: { position: 'absolute', backgroundColor: colors.background },
  top: { left: 0, right: 0, top: 0, borderBottomWidth: 2, borderBottomColor: colors.border },
  bottom: { left: 0, right: 0, bottom: 0, borderTopWidth: 2, borderTopColor: colors.accent },
  left: { left: 0, top: 0, bottom: 0, borderRightWidth: 2, borderRightColor: colors.accent },
  right: { right: 0, top: 0, bottom: 0, borderLeftWidth: 2, borderLeftColor: colors.border },
  scanline: {
    position: 'absolute',
    left: 0,
    top: '50%',
    height: 3,
    marginTop: -1.5,
    backgroundColor: colors.text,
    shadowColor: colors.accent,
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
  },
  centerPixel: {
    position: 'absolute',
    width: 14,
    height: 14,
    left: '50%',
    top: '50%',
    marginLeft: -7,
    marginTop: -7,
    backgroundColor: colors.text,
    borderColor: colors.accent,
    borderWidth: 3,
    shadowColor: colors.accent,
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 12,
  },
});
