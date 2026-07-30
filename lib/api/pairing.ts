/**
 * Eşleşme (pairing) işlemleri.
 * ------------------------------------------------------------------
 * G1-5 (Kod sistemi + eşleştirme) tamamlanana kadar burası SAHTE (mock)
 * çalışıyor. G1-5 bitince değişecek üç yer:
 *
 *  - generatePairCode() → Supabase'de yeni bir `pairs` satırı oluşturup
 *    gerçek pair_code'u döndürecek.
 *  - joinWithCode()      → verilen kodla eşleşen pair'i bulup
 *    user2_id'yi dolduracak.
 *  - waitForPartner()    → setTimeout yerine `pairs` tablosunda
 *    Supabase Realtime ile user2_id doldu mu diye dinleyecek.
 *
 * Ekranlar bu üç fonksiyonun içini bilmiyor, sadece çağırıyor.
 */

const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışabilecek 0/O, 1/I çıkarıldı
const CODE_LENGTH = 6;

function randomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
  }
  return code;
}

export async function generatePairCode(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return randomCode();
}

export type JoinResult =
  | { success: true }
  | { success: false; message: string };

export async function joinWithCode(code: string): Promise<JoinResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (code.length !== CODE_LENGTH) {
    return { success: false, message: 'Kod 6 karakter olmalı.' };
  }

  // Mock: gerçek G1-5 bağlanana kadar her doğru uzunluktaki kod kabul edilir.
  return { success: true };
}

/**
 * Kod oluşturan tarafın ekranında, partner kodu girene kadar bekler.
 * Şimdilik: sabit bir gecikme sonra "katıldı" varsayar.
 * G1-5'te: Supabase Realtime ile `pairs` tablosunu dinleyecek.
 */
export async function waitForPartner(_code: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 4000));
}
