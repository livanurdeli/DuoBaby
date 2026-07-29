/**
 * Boşluk ve köşe yuvarlaklığı skalası.
 * Bileşenlerde sabit sayılar yerine bu isimler kullanılır, böylece
 * tüm uygulamada tutarlı bir ritim korunur.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export default { spacing, radius };
