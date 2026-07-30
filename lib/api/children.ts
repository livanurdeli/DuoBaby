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

export type Gender = 'male' | 'female';

export type Traits = {
  hairColor: string;
  eyeColor: string;
  skinTone: string;
};

export type Child = {
  id: string;
  name: string;
  gender: Gender;
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
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    id: `mock-child-${Date.now()}`,
    name: input.name,
    gender: input.gender,
    ...input.traits,
  };
}
