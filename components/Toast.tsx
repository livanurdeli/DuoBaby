import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { brand } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

type ToastProps = {
  /** null → görünmez. Yeni bir metin gelince animasyon baştan oynar. */
  message: string | null;
  onHide: () => void;
  durationMs?: number;
};

/**
 * Uygulama açıkken gelen olaylar için kısa bildirim şeridi (G2-10).
 * Push bildirimleri uygulama kapalıyken çalışıyor; açıkken sistem
 * bildirimi göstermek yerine ekranın kendi şeridi daha az rahatsız edici.
 */
export function Toast({ message, onHide, durationMs = 3500 }: ToastProps) {
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;

    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(onHide);
    }, durationMs);

    return () => clearTimeout(timer);
    // onHide her render'da yeni referans olabilir; sadece mesaj değişince
    // yeniden oynaması gerekiyor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, durationMs]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity: slide,
          transform: [
            { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
          ],
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: brand.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  text: {
    ...typography.bodyBold,
    color: brand.paper,
    textAlign: 'center',
  },
});
