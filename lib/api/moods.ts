/**
 * Mod (ruh hali) işlemleri.
 * ------------------------------------------------------------------
 * Mod ÇOCUĞA değil, uygulamayı kullanan iki kişiye ait (bkz. roadmap
 * bölüm 1). Herkes günde bir kez kendi modunu girer, partnerininkini
 * görür.
 *
 * Ayrı bir RPC yok, gereken her kural zaten veritabanında:
 *  - `moods_one_per_day` unique (user_id, date) → günde tek kayıt,
 *  - `moods_insert_own` / `moods_update_own` policy'leri → kimse
 *    başkasının adına mod yazamaz, başkasınınkini düzeltemez,
 *  - `moods_select` → sadece kendi pair'inin modları görünür.
 *
 * Aynı gün tekrar giriş "hata" değil, düzeltme: upsert ile üstüne yazılır.
 */

import { supabase } from '@/lib/supabase';
import { ensureSession } from '@/lib/api/auth';
import { checkPairingStatus } from '@/lib/api/pairing';
import type { MoodColor } from '@/constants/colors';

export type { MoodColor };

/** Roadmap'teki 7 mod kategorisinin kullanıcıya gösterilen karşılıkları. */
export const MOOD_LABELS: Record<MoodColor, string> = {
  green: 'Çok mutlu',
  orange: 'Orta',
  red: 'Kötü',
  pink: 'Özledim',
  purple: 'Sıkıldım',
  yellow: 'Heyecanlı',
  blue: 'Üzgün',
};

/** Ekranlarda sabit sırada gösterilsin diye — Object.keys sırası garanti değil. */
export const MOOD_ORDER: MoodColor[] = [
  'green',
  'yellow',
  'orange',
  'pink',
  'purple',
  'blue',
  'red',
];

export const NOTE_MAX_LENGTH = 200;

export type Mood = {
  userId: string;
  color: MoodColor;
  note: string | null;
  date: string;
};

type MoodRow = {
  user_id: string;
  color: MoodColor;
  note: string | null;
  date: string;
};

const MOOD_COLUMNS = 'user_id, color, note, date';

function toMood(row: MoodRow): Mood {
  return {
    userId: row.user_id,
    color: row.color,
    note: row.note,
    date: row.date,
  };
}

/** Cihazın yerel günü — DB'deki `current_date` sunucu saatine göre çalışır. */
function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export async function saveTodayMood(input: {
  color: MoodColor;
  note?: string;
}): Promise<Mood> {
  const { userId } = await ensureSession();
  const pairing = await checkPairingStatus();
  if (pairing.status !== 'paired') {
    throw new Error('Önce partnerinizle eşleşmelisiniz.');
  }

  const note = input.note?.trim();

  const { data, error } = await supabase
    .from('moods')
    .upsert(
      {
        user_id: userId,
        pair_id: pairing.pairId,
        color: input.color,
        note: note ? note : null,
        date: today(),
      },
      { onConflict: 'user_id,date' }
    )
    .select(MOOD_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Mod kaydedilemedi.');
  }

  return toMood(data as MoodRow);
}

export type TodayMoods = {
  mine: Mood | null;
  partner: Mood | null;
};

/**
 * Bugünün iki modu. RLS zaten pair dışını kesiyor, o yüzden tek sorgu
 * yeterli — hangisinin kime ait olduğunu user_id'den ayırıyoruz.
 */
export async function getTodayMoods(): Promise<TodayMoods> {
  const { userId } = await ensureSession();

  const { data, error } = await supabase
    .from('moods')
    .select(MOOD_COLUMNS)
    .eq('date', today());

  if (error) throw error;

  const moods = (data ?? []).map((row) => toMood(row as MoodRow));

  return {
    mine: moods.find((m) => m.userId === userId) ?? null,
    partner: moods.find((m) => m.userId !== userId) ?? null,
  };
}
