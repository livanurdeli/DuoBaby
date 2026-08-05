/**
 * notify-partner — partnere push bildirimi gönderir (G1-10).
 * ------------------------------------------------------------------
 * Neden Edge Function: Expo push token'ı gönderen tarafın cihazından
 * okunamaz (RLS partnerin `push_token`'ını da veriyor ama token'ı
 * client'a hiç indirmemek daha temiz) ve Expo push API'sine istek
 * atmak sunucu işi.
 *
 * Neden DB trigger + webhook DEĞİL: pg_net + dashboard webhook kurulumu
 * MVP için fazladan iki hareketli parça. Aksiyonu yapan client zaten
 * başarılı cevabı aldıktan sonra burayı çağırıyor.
 *
 * Güvenlik: çağıranın JWT'si doğrulanıyor (Supabase default), partner
 * kimliği ve token'ı SERVICE ROLE ile sunucuda bulunuyor. Yani çağıran
 * kime bildirim gideceğini seçemiyor — sadece kendi partnerine gider.
 * Metin de burada üretiliyor, client'tan gelen metin kullanılmıyor.
 *
 * Deploy:  supabase functions deploy notify-partner
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

type NotifyKind = 'care' | 'mood' | 'stage';

type Payload = {
  kind: NotifyKind;
  /** care için aksiyon, stage için yeni evre. Serbest metin DEĞİL, enum. */
  detail?: string;
  childName?: string;
};

const CARE_TEXT: Record<string, string> = {
  feed: 'besledi 🍼',
  clean: 'temizledi 🧼',
  sleep: 'uyuttu 😴',
  play: 'oynadı 🧸',
};

const STAGE_TEXT: Record<string, string> = {
  baby: 'bebeklik günlerinde',
  child: 'artık bir çocuk 🎈',
  teen: 'ergenliğe girdi 🎸',
  adult: '18 yaşına geldi ve evden ayrıldı 🎓',
};

function buildMessage(payload: Payload, actorName: string): string | null {
  const child = payload.childName ?? 'çocuğunuz';

  switch (payload.kind) {
    case 'care': {
      const verb = payload.detail ? CARE_TEXT[payload.detail] : undefined;
      return verb ? `${actorName} ${child} ile ilgilendi: ${verb}` : null;
    }
    case 'mood':
      return `${actorName} bugünkü modunu girdi`;
    case 'stage': {
      const text = payload.detail ? STAGE_TEXT[payload.detail] : undefined;
      return text ? `${child} büyüyor — ${text}` : null;
    }
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Oturum yok.', { status: 401 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return new Response('Oturum gecersiz.', { status: 401 });
  }
  const userId = userData.user.id;

  const payload = (await req.json()) as Payload;

  // Partneri ve token'ını bul — çağıran seçemiyor, pair'den türetiliyor.
  const { data: pair } = await admin
    .from('pairs')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .maybeSingle();

  const partnerId =
    pair && (pair.user1_id === userId ? pair.user2_id : pair.user1_id);

  if (!partnerId) {
    return Response.json({ sent: false, reason: 'partner-yok' });
  }

  const { data: users } = await admin
    .from('users')
    .select('id, display_name, push_token')
    .in('id', [userId, partnerId]);

  const partner = users?.find((u) => u.id === partnerId);
  const actor = users?.find((u) => u.id === userId);

  if (!partner?.push_token) {
    return Response.json({ sent: false, reason: 'token-yok' });
  }

  const body = buildMessage(payload, actor?.display_name ?? 'Partnerin');
  if (!body) {
    return Response.json({ sent: false, reason: 'gecersiz-istek' });
  }

  const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: partner.push_token,
      title: 'DuoBaby',
      body,
      sound: 'default',
    }),
  });

  return Response.json({ sent: expoResponse.ok });
});
