/**
 * Bakım (care) işlemleri.
 * ------------------------------------------------------------------
 * G1-7 (Bakım logic'i) tamamlanana kadar SAHTE (mock) çalışıyor —
 * `createChild`'daki mock deseniyle aynı mantık.
 *
 * G1-7 bitince değişecek yerler:
 *  - applyCareAction() burada saf (pure) bir fonksiyon olarak kalabilir,
 *    ekranlar "optimistic update" için client'ta da çağırabilir.
 *  - logCareAction() → Supabase'de gerçek bir `care_actions` satırı
 *    oluşturacak ve barların gerçek güncel değerini (decay dahil)
 *    sunucudan geri döndürecek.
 *  - Decay (barların zamanla düşmesi) burada YOK — G1-7'de
 *    `last_decay_at` farkından hesaplanacak. Bu dosyada sadece
 *    ekranın kendi kendine test edebilmesi için hafif bir client-side
 *    decay yardımcı fonksiyonu var, gerçek kural değil.
 */

export type CareStats = {
  hunger: number;
  cleanliness: number;
  energy: number;
  happiness: number;
};

export type CareAction = 'feed' | 'clean' | 'sleep' | 'play';

/** Yeni oluşturulan bir çocuğun başlangıç bar değerleri. */
export const DEFAULT_CARE_STATS: CareStats = {
  hunger: 80,
  cleanliness: 80,
  energy: 80,
  happiness: 80,
};

/** Her aksiyonun barlar üzerindeki etkisi (roadmap'teki 4 aksiyon). */
const ACTION_EFFECTS: Record<CareAction, Partial<CareStats>> = {
  feed: { hunger: 30, energy: -5 },
  clean: { cleanliness: 35 },
  sleep: { energy: 40, happiness: 5, hunger: -5 },
  play: { happiness: 30, energy: -15, cleanliness: -5 },
};

/** Aksiyon butonlarındaki emoji + Türkçe etiket. */
export const ACTION_META: Record<CareAction, { label: string; emoji: string }> = {
  feed: { label: 'Besle', emoji: '🍼' },
  clean: { label: 'Temizle', emoji: '🧼' },
  sleep: { label: 'Uyut', emoji: '😴' },
  play: { label: 'Oyna', emoji: '🧸' },
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Bir aksiyonu barlara uygular, 0-100 aralığında clamp'lenmiş yeni değerleri döner. */
export function applyCareAction(stats: CareStats, action: CareAction): CareStats {
  const effect = ACTION_EFFECTS[action];
  const next: CareStats = { ...stats };

  (Object.keys(effect) as (keyof CareStats)[]).forEach((key) => {
    next[key] = clamp(stats[key] + (effect[key] ?? 0));
  });

  return next;
}

/** Aksiyonu sunucuya loglar (mock). G1-7 bitince gerçek insert olacak. */
export async function logCareAction(
  childId: string,
  action: CareAction
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  // TODO(G1-7): supabase.from('care_actions').insert({ child_id: childId, action_type: action })
  void childId;
  void action;
}

export type Expression = 'happy' | 'neutral' | 'sad' | 'sick';

const CRITICAL_THRESHOLD = 15;
const HAPPY_THRESHOLD = 70;
const NEUTRAL_THRESHOLD = 40;

/**
 * 4 barın ortalamasına + kritik durumlara göre çocuğun genel ifadesini
 * türetir. Bu değer hem karakterin animasyon tarzını hem de (G2-7'de)
 * hangi Lottie klibinin oynatılacağını belirleyecek tek kaynak.
 */
export function getExpression(stats: CareStats): Expression {
  const isCritical =
    stats.hunger <= CRITICAL_THRESHOLD ||
    stats.cleanliness <= CRITICAL_THRESHOLD ||
    stats.energy <= CRITICAL_THRESHOLD ||
    stats.happiness <= CRITICAL_THRESHOLD;

  if (isCritical) return 'sick';

  const average =
    (stats.hunger + stats.cleanliness + stats.energy + stats.happiness) / 4;

  if (average >= HAPPY_THRESHOLD) return 'happy';
  if (average >= NEUTRAL_THRESHOLD) return 'neutral';
  return 'sad';
}

/**
 * Geliştirme/test amaçlı hafif bir client-side decay. Gerçek decay kuralı
 * DEĞİL — sadece ekranı boş barlarla da görebilmek için var. G1-7 gelince
 * kaldırılabilir.
 */
export function applyDemoDecay(stats: CareStats, amount = 1): CareStats {
  return {
    hunger: clamp(stats.hunger - amount),
    cleanliness: clamp(stats.cleanliness - amount),
    energy: clamp(stats.energy - amount * 0.7),
    happiness: clamp(stats.happiness - amount * 0.5),
  };
}
