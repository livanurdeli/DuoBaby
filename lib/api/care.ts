/**
 * Bakım (care) işlemleri.
 * ------------------------------------------------------------------
 * G1-7 tamamlandı: mock kaldırıldı, barlar sunucuda hesaplanıyor
 * (bkz. supabase/migrations/0004_care.sql).
 *
 * Bardaki geçerli değer HER ZAMAN sunucudan dönen satır. Buradaki
 * `applyCareAction()` saf fonksiyonu yalnızca optimistic update için —
 * kullanıcı butona basınca bar anında hareket etsin, cevap gelince
 * gerçek değere otursun diye duruyor.
 *
 * Decay `last_decay_at` farkından sunucuda işleniyor; cron yok, uygulama
 * açılışındaki `syncCareStats()` çağrısı yetiyor (roadmap bölüm 8).
 */

import { supabase } from '@/lib/supabase';
import type { LifeStage } from '@/lib/api/children';

export type CareStats = {
  hunger: number;
  cleanliness: number;
  energy: number;
  happiness: number;
};

export type CareAction = 'feed' | 'clean' | 'sleep' | 'play';

/**
 * Sunucudan gerçek değerler gelene kadar gösterilen başlangıç değerleri.
 * `children` tablosundaki kolon default'larıyla (100) aynı — aksi hâlde
 * yeni çocukta barlar önce 80 görünüp sonra 100'e zıplardı.
 */
export const DEFAULT_CARE_STATS: CareStats = {
  hunger: 100,
  cleanliness: 100,
  energy: 100,
  happiness: 100,
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

type ChildRow = CareStats & {
  life_stage: LifeStage;
  status: 'active' | 'left_home';
};

/** İki RPC de aynı `children` satırını döndürüyor: barlar + evre bir arada. */
export type ChildSnapshot = {
  stats: CareStats;
  lifeStage: LifeStage;
  status: 'active' | 'left_home';
};

function toSnapshot(row: ChildRow): ChildSnapshot {
  return {
    stats: {
      hunger: row.hunger,
      cleanliness: row.cleanliness,
      energy: row.energy,
      happiness: row.happiness,
    },
    lifeStage: row.life_stage,
    status: row.status,
  };
}

/**
 * Geçen zamanı işler: birikmiş decay + `birth_date`'ten evre güncellemesi
 * (G1-8). Ekran açılışında bir kez çağrılır, cron gerekmiyor.
 */
export async function syncChild(childId: string): Promise<ChildSnapshot> {
  const { data, error } = await supabase.rpc('sync_child', {
    p_child_id: childId,
  });

  if (error || !data) {
    throw new Error(error?.message ?? 'Bakım durumu alınamadı.');
  }

  return toSnapshot(data as ChildRow);
}

/**
 * Aksiyonu uygular: sunucu önce decay'i işler, sonra etkiyi ekler ve
 * `care_actions`'a log atar. Dönen değer barların yeni gerçek hâli.
 */
export async function performCareAction(
  childId: string,
  action: CareAction
): Promise<ChildSnapshot> {
  const { data, error } = await supabase.rpc('apply_care_action', {
    p_child_id: childId,
    p_action: action,
  });

  if (error || !data) {
    throw new Error(error?.message ?? 'Aksiyon uygulanamadı.');
  }

  return toSnapshot(data as ChildRow);
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
