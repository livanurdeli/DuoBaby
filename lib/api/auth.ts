import { supabase } from '@/lib/supabase';

/**
 * Anonim oturum işlemleri.
 * ------------------------------------------------------------------
 * G1-4 tamamlandı: artık gerçek Supabase anonim oturumu kullanılıyor.
 * Ekranlar (`app/index.tsx` vb.) hâlâ sadece `ensureSession()` çağırıyor,
 * içeride ne olduğunu bilmiyor — bu yüzden bu değişiklik ekran
 * kodlarında hiçbir şeyi bozmadı.
 */

export type Session = {
  userId: string;
};

export async function ensureSession(): Promise<Session> {
  // Zaten açık bir oturum varsa (uygulama daha önce açılmış, AsyncStorage'da
  // kayıtlıysa) onu kullan, tekrar anonim oturum açma.
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session?.user) {
    return { userId: existing.session.user.id };
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.user) {
    throw error ?? new Error('Anonim oturum açılamadı.');
  }

  return { userId: data.user.id };
}
