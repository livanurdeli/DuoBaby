/**
 * Çocuk oluşturma işlemleri.
 * ------------------------------------------------------------------
 * G1-6 tamamlandı: mock kaldırıldı, gerçek `children` satırı yazılıyor.
 *
 * Ayrı bir RPC YOK — gereken iki güvence zaten veritabanında:
 *  - `children_insert` policy'si (0002) pair üyesi olmayanı engelliyor,
 *  - `trg_children_active_limit` trigger'ı (0001) 3 aktif çocuk sınırını
 *    uyguluyor.
 * Client'ın uydurabileceği tek alan pair_id ve onu da policy denetliyor.
 *
 * Rastgele özellik ataması client'ta kalıyor: reveal ekranı (G2-5)
 * özellikleri canlı çevirip durduğu değeri kaydediyor; sunucu yeniden
 * rastgele üretse ekranda gösterilen sonuç yalan olurdu. Özelliklerin
 * oyun içi avantajı yok, tamamen kozmetik.
 */

import { supabase } from '@/lib/supabase';
import { checkPairingStatus } from '@/lib/api/pairing';

export type Gender = 'male' | 'female';

export type LifeStage = 'baby' | 'child' | 'teen' | 'adult';

export type Traits = {
  hairColor: string;
  eyeColor: string;
  skinTone: string;
};

export type Child = {
  id: string;
  name: string;
  gender: Gender;
  birthDate: string;
  lifeStage: LifeStage;
} & Traits;

/**
 * Evre etiketleri ve eşikleri (G1-8). Eşikler `life_stage_for_age`
 * (0006_growth.sql) ile aynı; oran 1 gerçek gün = 1 oyun yılı.
 * Buradaki kopya sadece ekranda yaş/evre yazdırmak için — geçerli evre
 * her zaman sunucudan gelen `life_stage`.
 */
export const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  baby: 'Bebek',
  child: 'Çocuk',
  teen: 'Ergen',
  adult: 'Evden ayrıldı',
};

/** Doğum tarihinden oyun yaşı: 1 gerçek gün = 1 oyun yılı. */
export function gameAgeYears(birthDate: string): number {
  const days = (Date.now() - new Date(birthDate).getTime()) / 86_400_000;
  return Math.max(0, Math.floor(days));
}

const HAIR_COLORS = ['Siyah', 'Kahverengi', 'Sarı', 'Kızıl'] as const;
const EYE_COLORS = ['Kahverengi', 'Yeşil', 'Mavi', 'Ela'] as const;
const SKIN_TONES = ['Açık', 'Buğday', 'Esmer'] as const;

const CHILD_COLUMNS =
  'id, name, gender, hair_color, eye_color, skin_tone, birth_date, life_stage';

type ChildRow = {
  id: string;
  name: string;
  gender: Gender;
  hair_color: string;
  eye_color: string;
  skin_tone: string;
  birth_date: string;
  life_stage: LifeStage;
};

function toChild(row: ChildRow): Child {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    hairColor: row.hair_color,
    eyeColor: row.eye_color,
    skinTone: row.skin_tone,
    birthDate: row.birth_date,
    lifeStage: row.life_stage,
  };
}

function pickRandom<T>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomizeTraits(): Traits {
  return {
    hairColor: pickRandom(HAIR_COLORS),
    eyeColor: pickRandom(EYE_COLORS),
    skinTone: pickRandom(SKIN_TONES),
  };
}

export async function createChild(input: {
  name: string;
  gender: Gender;
  traits: Traits;
}): Promise<Child> {
  const pairing = await checkPairingStatus();
  if (pairing.status !== 'paired') {
    throw new Error('Önce partnerinizle eşleşmelisiniz.');
  }

  const { data, error } = await supabase
    .from('children')
    .insert({
      pair_id: pairing.pairId,
      name: input.name,
      gender: input.gender,
      hair_color: input.traits.hairColor,
      eye_color: input.traits.eyeColor,
      skin_tone: input.traits.skinTone,
    })
    .select(CHILD_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Çocuk oluşturulamadı.');
  }

  return toChild(data as ChildRow);
}

/**
 * Pair'in aktif çocuğu. MVP tek çocuk olduğu için ilk satır yeterli;
 * çoklu çocuk (v2) gelince burası liste döndürür.
 * RLS kullanıcıyı zaten kendi pair'ine kilitliyor, ekstra filtre gereksiz.
 */
export async function getActiveChild(): Promise<Child | null> {
  const { data, error } = await supabase
    .from('children')
    .select(CHILD_COLUMNS)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? toChild(data as ChildRow) : null;
}
