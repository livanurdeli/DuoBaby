import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { brand } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
  /** Kart içi boşluğu — büyük görsel ağırlıklı kartlarda 'sm' işe yarar. */
  padding?: 'sm' | 'lg';
};

/**
 * Ortak kart bileşeni: bakım barlarını, mod girişini, çocuk kartını vb.
 * sarmalamak için kullanılan tek düz yüzey.
 */
export function Card({ children, style, padding = 'lg' }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        padding === 'sm' ? styles.paddingSm : styles.paddingLg,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: brand.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    // React Native'de gölge iOS/Android'de farklı property'lerle çalışır;
    // ikisini birden veriyoruz ki iki platformda da tutarlı görünsün.
    shadowColor: brand.ink,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  paddingSm: {
    padding: spacing.md,
  },
  paddingLg: {
    padding: spacing.lg,
  },
});
