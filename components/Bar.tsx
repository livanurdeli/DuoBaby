import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { brand } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

type BarProps = {
  /** Ör. "Açlık", "Temizlik", "Enerji", "Mutluluk" */
  label: string;
  /** 0-100 arası bakım seviyesi. */
  value: number;
  /** Barın rengi — genelde constants/colors.ts içindeki `care` paletinden. */
  color: string;
  style?: ViewStyle;
};

const LOW_THRESHOLD = 20;

/**
 * Çocuğun bakım barlarını gösteren "imza" bileşen: yuvarlak uçlu, dolgusu
 * animasyonla değişen bir gösterge. Değer düşükse (≤20) etiket rengi
 * uyarı tonuna döner — kullanıcı sayıyı okumadan da fark etsin diye.
 */
export function Bar({ label, value, color, style }: BarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const heightAnim = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: clamped,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [clamped, heightAnim]);

  const isLow = clamped <= LOW_THRESHOLD;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: isLow ? brand.danger : color,
              height: heightAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.emoji}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    ...typography.caption,
    color: brand.ink,
    fontFamily: typography.bodyBold.fontFamily,
    fontSize: 12,
  },
  track: {
    width: 16,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: brand.forestMuted,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderRadius: radius.pill,
  },
  emoji: {
    fontSize: 22,
    marginTop: spacing.xs,
  },
});
