// Roadmap'te (docs/roadmap.md) tanımlanan mod renkleri.
// Tam tasarım sistemi G2-2 görevinde genişletilecek.

export const MOOD_COLORS = {
  green: '#22C55E', // Çok mutlu
  orange: '#F97316', // Orta
  red: '#EF4444', // Kötü
  pink: '#EC4899', // Özlemiş, görmek istiyor
  purple: '#A855F7', // Sıkılmış
  yellow: '#EAB308', // Heyecanlı
  blue: '#3B82F6', // Üzgün
} as const;

export type MoodColor = keyof typeof MOOD_COLORS;
