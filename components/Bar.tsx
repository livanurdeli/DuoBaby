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
  const widthAnim = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 450,
      useNativeDriver: false, // width animasyonu native driver desteklemiyor
    }).start();
  }, [clamped, widthAnim]);

  const isLow = clamped <= LOW_THRESHOLD;

  return (
    <View style={style}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, isLow && { color: brand.danger }]}>
          {Math.round(clamped)}
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: isLow ? brand.danger : color,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: brand.inkMuted,
  },
  value: {
    ...typography.caption,
    color: brand.ink,
    fontFamily: typography.bodyBold.fontFamily,
  },
  track: {
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: brand.forestMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
