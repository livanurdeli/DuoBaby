/**
 * Ortak streak (G1-9).
 * ------------------------------------------------------------------
 * Seriyi sunucu yazıyor (`update_streak`, 0007_streak.sql) — client'ın
 * yazma yetkisi yok, sadece okuyor.
 *
 * Sıfırlama okurken hesaplanıyor: seri koptuğunda kimsenin uygulamayı
 * açması gerekmiyor ki satır güncellensin. `last_completed_date` dünden
 * eskiyse seri fiilen 0'dır, DB'de hâlâ eski sayı yazıyor olsa bile.
 */

import { supabase } from '@/lib/supabase';

export type Streak = {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
  /** Bugün iki kişi de ilgilendi mi — "bugün tamam" rozeti için. */
  completedToday: boolean;
};

type StreakRow = {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
};

function daysBetween(from: string, to: Date): number {
  const [y, m, d] = from.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** RLS zaten kullanıcıyı kendi pair'ine kilitliyor — pair_id filtresi gereksiz. */
export async function getStreak(): Promise<Streak> {
  const { data, error } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_completed_date')
    .maybeSingle();

  if (error) throw error;

  const row = (data as StreakRow | null) ?? {
    current_streak: 0,
    longest_streak: 0,
    last_completed_date: null,
  };

  const gap = row.last_completed_date
    ? daysBetween(row.last_completed_date, new Date())
    : null;

  return {
    // gap 0 = bugün, 1 = dün (seri hâlâ ayakta, bugün tamamlanabilir).
    current: gap !== null && gap <= 1 ? row.current_streak : 0,
    longest: row.longest_streak,
    lastCompletedDate: row.last_completed_date,
    completedToday: gap === 0,
  };
}
