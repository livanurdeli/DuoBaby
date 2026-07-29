/**
 * Anonim oturum işlemleri.
 * ------------------------------------------------------------------
 * G1-4 (Anonim auth akışı) tamamlanana kadar burası SAHTE (mock) bir
 * oturum döndürür. Supabase kurulduğunda değişecek olan TEK yer burası:
 *
 *   export async function ensureSession(): Promise<Session> {
 *     const { data, error } = await supabase.auth.signInAnonymously();
 *     if (error) throw error;
 *     return { userId: data.user!.id };
 *   }
 *
 * Ekranlar (`app/index.tsx` vb.) bu fonksiyonun içinde ne olduğunu
 * bilmez, sadece `ensureSession()` çağırır — bu yüzden Supabase
 * bağlandığında ekran kodlarında hiçbir değişiklik gerekmez.
 */

export type Session = {
  userId: string;
};

const MOCK_NETWORK_DELAY_MS = 500;

export async function ensureSession(): Promise<Session> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS));
  return { userId: 'mock-user-1' };
}
