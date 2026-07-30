/**
 * Eşleşme (pairing) işlemleri.
 * ------------------------------------------------------------------
 * G1-5 tamamlandı: mock kaldırıldı, iki RPC'ye bağlandı
 * (bkz. supabase/migrations/0003_pairing.sql).
 *
 * Kod artık DB'de üretiliyor — çakışma kontrolü ve unique index orada,
 * client'ta kod üretmek iki kişiye aynı kodu verebilirdi.
 *
 * Ekranlar bu üç fonksiyonun içini bilmiyor, sadece çağırıyor.
 */

import { supabase } from '@/lib/supabase';
import { ensureSession } from '@/lib/api/auth';

export async function generatePairCode(): Promise<string> {
  await ensureSession();

  const { data, error } = await supabase.rpc('create_pair');
  if (error || !data) {
    throw new Error(error?.message ?? 'Kod oluşturulamadı.');
  }
  return data as string;
}

export type JoinResult =
  | { success: true }
  | { success: false; message: string };

export async function joinWithCode(code: string): Promise<JoinResult> {
  await ensureSession();

  // join_pair kodu upper(trim()) ile normalize ediyor, hata mesajları
  // (`Kod bulunamadi.`, `Bu kod zaten kullanilmis.` ...) doğrudan
  // kullanıcıya gösterilmek üzere yazıldı.
  const { error } = await supabase.rpc('join_pair', { p_code: code });
  return error ? { success: false, message: error.message } : { success: true };
}

const POLL_MS = 2000;
const TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Kod oluşturan tarafın ekranında, partner kodu girene kadar bekler.
 * ponytail: 2sn polling — eşleşme ekranı kısa ömürlü ve tek satır
 * sorguluyor. Realtime subscription G1-11'de gelecek, o zaman burası
 * postgres_changes dinlemeye döner.
 */
export async function waitForPartner(code: string): Promise<void> {
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { data } = await supabase
      .from('pairs')
      .select('user2_id')
      .eq('pair_code', code)
      .maybeSingle();

    if (data?.user2_id) return;

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  throw new Error('Partner bekleme süresi doldu.');
}
