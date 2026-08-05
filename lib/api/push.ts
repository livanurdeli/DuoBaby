/**
 * Push notification (G1-10).
 * ------------------------------------------------------------------
 * İki iş var:
 *  1. Cihazın Expo push token'ını `users.push_token`'a yazmak,
 *  2. Bir şey olduğunda partnere bildirim tetiklemek.
 *
 * Bildirim metni burada ÜRETİLMİYOR — Edge Function'da üretiliyor
 * (supabase/functions/notify-partner). Client sadece "ne oldu"yu
 * söylüyor; yoksa kullanıcı partnerinin telefonuna istediği metni
 * gönderebilirdi.
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { ensureSession } from '@/lib/api/auth';

export type NotifyKind = 'care' | 'mood' | 'stage';

/**
 * İzin ister, token'ı alır, profile yazar. Emülatörde çalışmaz — push
 * gerçek cihaz gerektirir (roadmap bölüm 8), o yüzden sessizce çıkıyor.
 */
export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'DuoBaby',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const granted =
    existing.granted ||
    (await Notifications.requestPermissionsAsync()).granted;

  if (!granted) return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync();

  const { userId } = await ensureSession();
  await supabase.from('users').update({ push_token: token }).eq('id', userId);

  return token;
}

/**
 * Partnere bildirim tetikler. Bildirim kozmetik: başarısız olursa
 * kullanıcının yaptığı işi (besleme, mod girişi) bozmaz — o yüzden
 * hata fırlatmıyor, sadece loglanıyor.
 */
export async function notifyPartner(input: {
  kind: NotifyKind;
  detail?: string;
  childName?: string;
}): Promise<void> {
  try {
    await supabase.functions.invoke('notify-partner', { body: input });
  } catch (err) {
    console.warn('Bildirim gonderilemedi:', err);
  }
}
