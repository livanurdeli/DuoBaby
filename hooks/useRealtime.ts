/**
 * Realtime abonelikleri (G1-11).
 * ------------------------------------------------------------------
 * Karşı taraf bir aksiyon yapınca ya da modunu girince ekran kendi
 * kendine güncellensin diye. Postgres Changes RLS'e saygı duyduğu için
 * (bkz. 0005_realtime.sql) pair dışından olay gelmez — burada ekstra
 * bir güvenlik filtresi yok, olması da gerekmiyor.
 *
 * Callback'ler ref'te tutuluyor: ekran her render'da yeni bir fonksiyon
 * yaratır, ref olmasa her render'da kanal kapanıp yeniden açılırdı.
 */

import { useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';
import type { CareStats } from '@/lib/api/care';
import type { LifeStage } from '@/lib/api/children';
import type { MoodColor } from '@/constants/colors';

type ChildRow = CareStats & {
  id: string;
  name: string;
  life_stage: LifeStage;
  status: string;
};

type MoodRow = {
  user_id: string;
  color: MoodColor;
  note: string | null;
  date: string;
};

function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/** Çocuk satırındaki her değişikliği (bakım barları, evre) dinler. */
export function useRealtimeChild(
  childId: string | undefined,
  onChange: (row: ChildRow) => void
) {
  const handler = useLatest(onChange);

  useEffect(() => {
    if (!childId) return;

    const channel = supabase
      .channel(`child:${childId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'children',
          filter: `id=eq.${childId}`,
        },
        (payload) => handler.current(payload.new as ChildRow)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [childId, handler]);
}

/**
 * Partnerin mod girişini dinler. Kendi girdiğimiz mod da olay olarak
 * gelir; `excludeUserId` ile eleniyor, yoksa kendi modumuz partnerin
 * kartında görünürdü.
 */
export function useRealtimePartnerMood(
  excludeUserId: string | undefined,
  onChange: (row: MoodRow) => void
) {
  const handler = useLatest(onChange);

  useEffect(() => {
    if (!excludeUserId) return;

    const channel = supabase
      .channel('moods')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moods' },
        (payload) => {
          const row = payload.new as MoodRow;
          if (row?.user_id && row.user_id !== excludeUserId) {
            handler.current(row);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [excludeUserId, handler]);
}
