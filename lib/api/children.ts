/**
 * Çocuk oluşturma işlemleri.
 * ------------------------------------------------------------------
 * G1-6 (Çocuk oluşturma logic'i) tamamlanana kadar SAHTE (mock)
 * çalışıyor. G1-6 bitince değişecek yer:
 *
 *  - createChild() → Supabase'de gerçek bir `children` satırı oluşturup
 *    (pair_id, name, gender, hair_color, eye_color, skin_tone) kaydedecek.
 *
 * Rastgele özellik ataması (randomizeTraits) istemci tarafında kalabilir
 * ya da backend'e taşınabilir — ekranlar için fark etmez, sadece
 * `randomizeTraits()` ve `createChild()` çağırıyorlar.
 */

import { supabase } from '@/lib/supabase';
import { ensureSession } from '@/lib/api/auth';

export type Gender = 'male' | 'female';

export type Traits = {
  hairColor: string;
  eyeColor: string;
  skinTone: string;
};

export type LifeStage = 'baby' | 'child' | 'teen' | 'adult';

export type Child = {
  id: string;
  name: string;
  gender: Gender;
  lifeStage: LifeStage;
  hunger: number;
  cleanliness: number;
  energy: number;
  happiness: number;
} & Traits;

const HAIR_COLORS = ['Siyah', 'Kahverengi', 'Sarı', 'Kızıl'] as const;
const EYE_COLORS = ['Kahverengi', 'Yeşil', 'Mavi', 'Ela'] as const;
const SKIN_TONES = ['Açık', 'Buğday', 'Esmer'] as const;

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
  const { userId } = await ensureSession();

  // Aktif çift (pair) bilgisini sorgula
  const { data: pairData, error: pairError } = await supabase
    .from('pairs')
    .select('id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .maybeSingle();

  if (pairError || !pairData) {
    throw new Error(
      pairError?.message ?? 'Eşleşme (pair) bulunamadı. Önce bir partnerle eşleşmelisiniz.'
    );
  }

  // Supabase children tablosuna kaydet (snake_case eşlemesi)
  const { data: childData, error: childError } = await supabase
    .from('children')
    .insert({
      pair_id: pairData.id,
      name: input.name,
      gender: input.gender,
      hair_color: input.traits.hairColor,
      eye_color: input.traits.eyeColor,
      skin_tone: input.traits.skinTone,
    })
    .select()
    .single();

  if (childError || !childData) {
    throw new Error(childError?.message ?? 'Çocuk kaydı oluşturulamadı.');
  }

  return {
    id: childData.id,
    name: childData.name,
    gender: childData.gender as Gender,
    hairColor: childData.hair_color,
    eyeColor: childData.eye_color,
    skinTone: childData.skin_tone,
    lifeStage: childData.life_stage as LifeStage,
    hunger: childData.hunger,
    cleanliness: childData.cleanliness,
    energy: childData.energy,
    happiness: childData.happiness,
  };
}

export async function performCareAction(
  childId: string,
  actionType: 'feed' | 'clean' | 'sleep' | 'play',
  currentValue: number
): Promise<number> {
  const { userId } = await ensureSession();

  const increment = 20;
  const newValue = Math.min(100, currentValue + increment);

  const columnMap = {
    feed: 'hunger',
    clean: 'cleanliness',
    sleep: 'energy',
    play: 'happiness',
  };

  const columnName = columnMap[actionType];

  // 1. Care action kaydını oluştur
  const { error: actionError } = await supabase
    .from('care_actions')
    .insert({
      child_id: childId,
      user_id: userId,
      action_type: actionType,
    });

  if (actionError) throw actionError;

  // 2. Çocuğun ilgili bar değerini güncelle
  const { error: updateError } = await supabase
    .from('children')
    .update({
      [columnName]: newValue,
    })
    .eq('id', childId);

  if (updateError) throw updateError;

  return newValue;
}

