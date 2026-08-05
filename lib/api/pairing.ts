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

const TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Kod oluşturan tarafın ekranında, partner kodu girene kadar bekler.
 * G1-11 ile polling kalktı: `pairs` realtime yayınında (0005), partner
 * `join_pair` çağırdığı anda UPDATE olayı geliyor.
 *
 * Aboneliği kurmadan ÖNCE bir kez sorguluyoruz — partner biz dinlemeye
 * başlamadan katılmış olabilir, o olay bir daha gelmez.
 */
export async function waitForPartner(code: string): Promise<void> {
  const alreadyJoined = async () => {
    const { data } = await supabase
      .from('pairs')
      .select('user2_id')
      .eq('pair_code', code)
      .maybeSingle();
    return Boolean(data?.user2_id);
  };

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      supabase.removeChannel(channel);
      if (err) reject(err);
      else resolve();
    };

    const timer = setTimeout(
      () => finish(new Error('Partner bekleme süresi doldu.')),
      TIMEOUT_MS
    );

    const channel = supabase
      .channel(`pair:${code}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pairs',
          filter: `pair_code=eq.${code}`,
        },
        (payload) => {
          if ((payload.new as { user2_id: string | null }).user2_id) finish();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          alreadyJoined().then((joined) => {
            if (joined) finish();
          });
        }
      });
  });
}

export type PairingStatus =
  | { status: 'none' }
  | { status: 'pending'; code: string }
  | { status: 'paired'; pairId: string };

export async function checkPairingStatus(): Promise<PairingStatus> {
  const session = await ensureSession();
  const userId = session.userId;

  const { data, error } = await supabase
    .from('pairs')
    .select('id, user1_id, user2_id, pair_code')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return { status: 'none' };
  }

  if (data.user2_id === null) {
    return { status: 'pending', code: data.pair_code };
  }

  return { status: 'paired', pairId: data.id };
}

