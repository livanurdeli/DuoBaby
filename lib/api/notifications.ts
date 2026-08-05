/**
 * Bildirim akışı (G2-10).
 * ------------------------------------------------------------------
 * Ayrı bir `notifications` tablosu YOK. Bildirim dediğimiz şey zaten
 * kayıtlı olan olayların okunuşu: `care_actions` (kim ne yaptı) ve
 * `moods` (kim modunu girdi). Yeni tablo açmak aynı veriyi iki yerde
 * tutmak olurdu — ve "okundu" bilgisi MVP'de istenmiyor.
 *
 * RLS zaten pair dışını kesiyor, ekstra filtre yok.
 */

import { supabase } from '@/lib/supabase';
import { ensureSession } from '@/lib/api/auth';
import { ACTION_META, type CareAction } from '@/lib/api/care';
import { MOOD_LABELS, type MoodColor } from '@/lib/api/moods';

export type AppEvent = {
  id: string;
  at: string;
  text: string;
  /** Kendi yaptığımız işler listede daha soluk gösteriliyor. */
  mine: boolean;
};

const FEED_LIMIT = 30;

export function careEventText(
  action: CareAction,
  childName: string,
  actorName: string
): string {
  const meta = ACTION_META[action];
  return `${actorName}, ${childName} ile ilgilendi — ${meta.label} ${meta.emoji}`;
}

export async function getRecentEvents(childName = 'çocuğunuz'): Promise<AppEvent[]> {
  const { userId } = await ensureSession();

  const [care, moods] = await Promise.all([
    supabase
      .from('care_actions')
      .select('id, user_id, action_type, created_at')
      .order('created_at', { ascending: false })
      .limit(FEED_LIMIT),
    supabase
      .from('moods')
      .select('id, user_id, color, note, date, created_at')
      .order('created_at', { ascending: false })
      .limit(FEED_LIMIT),
  ]);

  if (care.error) throw care.error;
  if (moods.error) throw moods.error;

  const name = (uid: string) => (uid === userId ? 'Sen' : 'Partnerin');

  const careEvents: AppEvent[] = (care.data ?? []).map((row) => ({
    id: `care-${row.id}`,
    at: row.created_at as string,
    mine: row.user_id === userId,
    text: careEventText(row.action_type as CareAction, childName, name(row.user_id)),
  }));

  const moodEvents: AppEvent[] = (moods.data ?? []).map((row) => ({
    id: `mood-${row.id}`,
    at: row.created_at as string,
    mine: row.user_id === userId,
    text:
      `${name(row.user_id)} modunu girdi: ${MOOD_LABELS[row.color as MoodColor]}` +
      (row.note ? ` — ${row.note}` : ''),
  }));

  return [...careEvents, ...moodEvents]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, FEED_LIMIT);
}
