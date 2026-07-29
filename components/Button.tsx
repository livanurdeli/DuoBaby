import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { brand } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
};

type VariantStyle = { container: ViewStyle; text: TextStyle };

const variants: Record<ButtonVariant, VariantStyle> = {
  primary: {
    container: { backgroundColor: brand.forest },
    text: { color: brand.surface },
  },
  secondary: {
    container: { backgroundColor: brand.forestMuted },
    text: { color: brand.forest },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: brand.ink },
  },
};

/**
 * Ortak buton bileşeni. Üç varyant:
 *  - primary   → ana aksiyon (ör. "Besle", "Kod ile eşleş")
 *  - secondary → ikincil, daha az vurgulu aksiyon
 *  - ghost     → arka planı olmayan, metin ağırlıklı aksiyon (ör. "Vazgeç")
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variants[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        size === 'lg' && styles.sizeLg,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color as string} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, variantStyle.text]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    minHeight: 48,
  },
  sizeLg: {
    paddingVertical: spacing.lg,
    minHeight: 56,
  },
  label: {
    ...typography.button,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
