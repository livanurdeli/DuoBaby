# 👶 Sanal Çocuk Bakma Uygulaması — Yol Haritası & Görev Dağılımı

> 2 kişilik ekip · Expo (React Native) + TypeScript + Supabase
> Hedef: 5-6 haftada MVP, sonrasında v2 özellikleri

---

## 1. Proje Özeti

İki kişinin ortak baktığı sanal bir çocuk. Bebeklikten (0 yaş) başlayıp 18 yaşına kadar büyüyor, 18'inde evden ayrılıyor. Aynı anda en fazla 3 çocuğa bakılabiliyor; bir çocuk evden ayrıldıktan sonra yenisi evlat edinilebiliyor. Besleme, temizlik, oyun gibi bakım mekanikleri + kıyafet giydirme var. Karşı tarafın yaptığı her işlem gerçek zamanlı görünüyor, bildirim gidiyor.

**Kritik fark:** Mod (ruh hali) sistemi çocuğa değil, **uygulamayı kullanan iki kişiye** ait. Her gün ikiniz de kendi modunuzu giriyorsunuz, birbirinizinkini görüyorsunuz. Çocuğun kendi ayrı bakım barları (açlık, temizlik, enerji, mutluluk) var — bunlar sizin modunuzdan bağımsız.

**Mod renkleri (kullanıcıya ait):** 🟢 Yeşil: Çok mutlu
🟠 Turuncu: Orta
🔴 Kırmızı: Kötü
🩷 Pembe: Özlemiş, sizi görmek istiyor
 🟣 Mor (sıkılmış)
 🟡 Sarı (heyecanlı)
 🔵 Mavi (üzgün)


---

## 2. Teknoloji Stack'i

| Katman | Seçim | Neden |
|---|---|---|
| Mobil | Expo (React Native) + TypeScript | Kolay build, OTA update, notification desteği |
| Navigasyon | Expo Router | Dosya tabanlı, basit |
| Backend | Supabase | PostgreSQL — çocuk/aile/kıyafet gibi ilişkisel veriler için uygun, Auth + Realtime + Storage hazır |
| Server logic | Supabase Edge Functions + pg_cron | Barların düşmesi, yaş ilerlemesi, streak hesabı, bildirim tetikleme |
| Bildirim | Expo Notifications | Push için yeterli |
| Animasyon | Lottie (lottie-react-native) | Yaş evrelerine göre hazır karakter animasyonları |
| State | Zustand veya React Query | Basit tut, Redux'a gerek yok |
| Storage | Supabase Storage | Kıyafet görselleri, anı defteri fotoğrafları |

**Not:** Ayrı backend (FastAPI vb.) YOK. Server-side logic gerekirse Edge Functions.

---

## 3. MVP Kapsamı (v1)

Proje kapsamı geniş (3 çocuk, evlat edinme, kıyafet, anı defteri...). MVP'yi küçük tutup **tek çocukla** başlamak, sistemi oturttuktan sonra çoğaltmak en sağlıklısı.

✅ MVP'de OLACAKLAR:
- **Kayıtsız giriş:** Uygulama açılışında otomatik anonim oturum oluşturma (e-posta/şifre yok)
- Sistemin otomatik ürettiği kod ile davet + eşleşme (kodu paylaşarak eşleşme)
- **Tek çocuk oluşturma:** cinsiyet seçimi + rastgele fiziksel özellikler (saç/göz/ten rengi) + ortak isim koyma
- Günlük kullanıcı modu girişi (renk + 1 cümlelik not) + karşı tarafın modunu anlık görme
- Mod takvimi (aylık renkli kutucuk görünümü)
- Çocuk için 4 bakım barı (açlık, temizlik, enerji, mutluluk)
- Bakım aksiyonları: besle, temizle, uyut, oyna
- Barların zamanla otomatik düşmesi
- **Basitleştirilmiş büyüme:** 3 evre (Bebek 0-3 / Çocuk 3-12 / Ergen 12-18), her evre geçişinde bildirim + görünüm değişimi
- Karşı taraf aksiyon yapınca bildirim ("Ayşe Miço'yu besledi 🍼")
- Ortak streak (ikisi de aynı gün ilgilenirse seri devam)

❌ MVP'de OLMAYACAKLAR (v2'ye):
- 3 çocuğa kadar çoklu çocuk + evlat edinme akışı
- Kıyafet / dolap sistemi
- Detaylı 6 evreli büyüme (yürümeye başlayan, okul öncesi ayrımı vb.)
- Anı defteri / fotoğraf albümü
- Yetenek/hobi sistemi, okul karneleri
- Mini oyunlar
- 18 yaşında ayrılış — veda mektubu / mezuniyet galerisi
- Ana ekran widget'ı

---

## 4. Veritabanı Şeması (Taslak)

```
users          → id (Supabase anonymous auth id), display_name, avatar,
                 push_token, created_at
pairs          → id, user1_id, user2_id, pair_code (unique, eşleşme için), created_at

children       → id, pair_id, name, gender, hair_color, eye_color, skin_tone,
                 birth_date, life_stage (baby/child/teen/adult),
                 hunger, cleanliness, energy, happiness,
                 last_decay_at, status (active/left_home), created_at
                 -- pair_id + status ile "aynı anda 3 aktif çocuk" kontrolü yapılır

moods          → id, user_id, pair_id, color (green/orange/red/pink),
                 note, date (unique: user_id + date)

care_actions   → id, child_id, user_id, action_type (feed/clean/sleep/play),
                 created_at

-- v2 için hazır olsun diye şimdiden düşünülebilir, MVP'de dokunulmaz:
wardrobe_items → id, name, category, min_life_stage, image_url
child_outfits  → child_id, wardrobe_item_id
milestones     → id, child_id, type (first_word/first_day_school/...), date, note
streaks        → pair_id, current_streak, longest_streak, last_completed_date
```

**Kritik noktalar:**
- **Anonim auth + kod sistemi:** Supabase'in anonymous auth özelliği kullanılır, e-posta/şifre yok. Eşleşme için otomatik bir `pair_code` üretilir, arkadaşınız bu kodu girerek eşleşir.
- **Kurtarma/geri yükleme YOK:** Uygulama silinir veya cihaz değişirse, o kullanıcının anonim oturumu ve dolayısıyla erişimi kaybolur. Bu bilinçli bir MVP kararı — kullanıcıya onboarding'de net şekilde belirtilmeli ("bu uygulamayı silersen erişimini kaybedersin" gibi kısa bir uyarı).
- RLS (Row Level Security): Herkes sadece kendi pair'inin verisini görebilmeli.
- `moods` tablosunda `(user_id, date)` UNIQUE → günde 1 mod girişi.
- `children` tablosunda `pair_id` başına **aktif (status=active) çocuk sayısı 3 ile sınırlı** — bu kural bir Postgres trigger veya Edge Function ile uygulanmalı (uygulama tarafında da kontrol edilsin ama asıl güvence veritabanında olmalı).
- Yaş/evre hesabı: `birth_date` üzerinden türetilir, ayrı bir "age" kolonu tutmaya gerek yok.
- Bar düşürme: pg_cron ile saatlik job YERİNE, uygulama açılışında `last_decay_at` farkından hesaplama (MVP için daha kolay, cron'suz çalışır).

---

## 5. Görev Dağılımı

> Adları placeholder olarak bıraktım — kendi isimlerinize göre değiştirin. Katman bazlı bölüşüm öneriliyor: biri veri/mantık, diğeri arayüz/deneyim.

### 👤 Geliştirici 1 (Data + Logic ağırlıklı)

| # | Görev | Detay |
|---|---|---|
| G1-1 | Supabase projesi kurulumu | Proje aç, env yapısı, client config |
| G1-2 | Şema + migration'lar | Yukarıdaki tablolar, index'ler, UNIQUE constraint'ler |
| G1-3 | RLS policy'leri | Pair bazlı erişim kuralları — en kritik iş |
| G1-4 | Anonim auth akışı | Supabase anonymous auth entegrasyonu, session yönetimi |
| G1-5 | Kod sistemi + eşleştirme | Rastgele kod üretme, kodla eşleşme, pair oluşturma |
| G1-6 | Çocuk oluşturma logic'i | Cinsiyet seçimi + rastgele özellik ataması + isim kaydı |
| G1-7 | Bakım logic'i | Aksiyon → bar güncelleme, decay hesabı |
| G1-8 | Büyüme/evre logic'i | `birth_date`'ten evre türetme, evre geçiş tetikleyicisi |
| G1-9 | Streak hesabı | Günlük kontrol, seri artırma/sıfırlama |
| G1-10 | Push notification | Expo push token kaydı, Edge Function ile tetikleme |
| G1-11 | Realtime subscription'lar | Mod ve bakım değişikliklerini canlı dinleme |

### 👤 Geliştirici 2 (UI + UX ağırlıklı)

| # | Görev | Detay |
|---|---|---|
| G2-1 | Expo projesi kurulumu | TypeScript, Expo Router, temel klasör yapısı |
| G2-2 | Tasarım sistemi | Renk paleti (mod renkleri dahil), tipografi, ortak componentler (Button, Card, Bar) |
| G2-3 | Onboarding ekranları | Karşılama ekranı, otomatik anonim oturum arka planda açılırken kısa bir yükleme/karşılama akışı |
| G2-4 | Eşleşme + kod ekranları | Kod göster / kod gir / kod kopyalama-paylaşma akışı |
| G2-5 | Çocuk oluşturma ekranı | Cinsiyet seçimi + rastgele sonuç animasyonu + isim girişi |
| G2-6 | Ana ekran (çocuk ekranı) | Karakter, 4 bar, aksiyon butonları |
| G2-7 | Lottie animasyonları | Evrelere göre (bebek/çocuk/ergen) idle, mutlu, üzgün, yemek yeme animasyonları |
| G2-8 | Mod giriş ekranı | Renk seçici + not alanı |
| G2-9 | Mod takvimi | Aylık grid görünümü (GitHub contribution tarzı) |
| G2-10 | Bildirim UI | In-app bildirim listesi / toast'lar |

### 🤝 Ortak Görevler

| # | Görev | Detay |
|---|---|---|
| O-1 | Şema tasarım oturumu | 1 akşam beraber oturun, tabloları netleştirin (Hafta 1'in ilk işi) |
| O-2 | PR review | Birbirinizin her PR'ını review edin — ikiniz de her tarafı öğrenin |
| O-3 | Haftalık sync | Haftada 1 kısa toplantı: ne bitti, ne tıkandı, sıradaki ne |
| O-4 | Test | Her hafta sonu iki telefonda beraber gerçek akışı test edin |

---

## 6. Haftalık Yol Haritası

### 📅 Hafta 1 — Temel + Eşleşme
**Hedef: İki kullanıcı kayıt olup birbirleriyle eşleşebiliyor.**

- [ ] O-1: Şema tasarım oturumu
- [ ] Repo kurulumu + branch koruması + kanban (aşağıdaki GitHub bölümüne bak)
- [ ] G1-1, G1-2, G1-3: Supabase kurulum + şema + RLS
- [ ] G2-1, G2-2: Expo kurulum + tasarım sistemi
- [ ] G1-4 + G2-3: Anonim auth (backend + UI paralel)
- [ ] G1-5 + G2-4: Kod üretme + eşleştirme (backend + UI paralel)

**Hafta sonu testi:** İki telefonda uygulamayı aç (kayıt yok, otomatik oturum) → biri kod üretsin, diğeri girsin → pair oluşsun.

### 📅 Hafta 2 — Çocuk Oluşturma + Mod Sistemi
**Hedef: Çocuk oluşturuluyor, mod girişi + karşı tarafı canlı görme çalışıyor.**

- [ ] G1-6 + G2-5: Çocuk oluşturma (cinsiyet seçimi, rastgele özellik, isim)
- [ ] G2-8: Mod giriş ekranı
- [ ] G1-11: Realtime subscription (mood değişince anında yansısın)
- [ ] G2-9: Mod takvimi
- [ ] Mod girişinde günde 1 kayıt kuralının testi

**Hafta sonu testi:** Çocuk oluştur → biri mod girince öbürünün ekranında anında görünsün.

### 📅 Hafta 3 — Bakım Sistemi
**Hedef: Çocuk ekranı canlı, barlar çalışıyor.**

- [ ] G2-6, G2-7: Çocuk ekranı + evre bazlı animasyonlar
- [ ] G1-7: Bakım aksiyonları + bar decay logic'i
- [ ] Aksiyonların care_actions'a loglanması
- [ ] Bar seviyelerine göre çocuğun animasyon/ifade değişimi
- [ ] İhmal durumu: barlar çok düşükse üzgün/hasta görünüm

**Hafta sonu testi:** Besle → bar dolsun + karşı tarafta güncellensin; 24 saat bekle → barlar düşsün.

### 📅 Hafta 4 — Büyüme Sistemi
**Hedef: Çocuk zamanla evre değiştiriyor.**

- [ ] G1-8: Büyüme/evre logic'i (`birth_date`'ten evre türetme)
- [ ] Evre geçişinde bildirim + görünüm/animasyon değişimi
- [ ] Test amaçlı hızlandırılmış zaman modu (geliştirme sırasında günleri simüle edebilmek için — production'da kapalı olacak bir debug ayarı)

**Hafta sonu testi:** Test modunda zamanı ileri sarıp çocuğun bebek → çocuk → ergen evrelerine geçtiğini gözlemleyin.

### 📅 Hafta 5 — Bildirim + Streak + Polish
**Hedef: Yayınlanabilir MVP.**

- [ ] G1-10: Push notification (aksiyon + mod bildirimleri)
- [ ] G1-9: Streak sistemi + UI'da gösterimi
- [ ] G2-10: Bildirim listesi
- [ ] Boş durumlar (empty state), hata ekranları, loading'ler
- [ ] Genel polish: animasyon geçişleri, ufak bug'lar

### 📅 Hafta 6 — Test + Yayın Hazırlığı
- [ ] EAS Build ile internal test build'i → iki telefona kur
- [ ] 1 hafta boyunca ikiniz gerçekten kullanın (dogfooding)
- [ ] Notlarınızı toplayın, v2 listesini buna göre güncelleyin

### 📅 v2 (MVP sonrası — sırayla)

1. **Çoklu çocuk (3'e kadar) + evlat edinme akışı** — bir çocuk `status=left_home` olunca yeni çocuk ekleme
2. **Hesap kurtarma** — cihaz kaybı/uygulama silinmesi durumunda hesaba geri dönme (isteğe bağlı e-posta bağlama ya da kurtarma kodu)
3. **18 yaşında ayrılış deneyimi** — veda mektubu, mezuniyet/anı galerisi
4. **Kıyafet sistemi** — dolap, evreye/mevsime göre kıyafet, satın alma
5. **Detaylı büyüme evreleri** — 6 evreye çıkarma (yürümeye başlayan, okul öncesi vb.)
6. **Anı defteri / fotoğraf albümü** — her yaş dönümünde kayıt
7. **Yetenek/hobi sistemi + okul karneleri**
8. **Ana ekran widget'ı** (retention için değerli)
9. **Mini oyunlar**
10. **Kişilik gelişimi** — bakım şekline göre çocuğun karakteri şekillensin
11. **Kardeşler arası etkileşim** (çoklu çocuk sonrası anlamlı olur)

---

## 7. GitHub Workflow

### Kurallar
- **Tek repo**, `main` branch **korumalı** (Settings → Branch protection → require PR).
- Direkt `main`'e push YASAK. Her iş için feature branch:
  - `feat/mood-entry`, `feat/child-creation`, `feat/growth-stages`, `fix/streak-reset` ...
- Her branch → PR → **öbürü review'lar** → merge.
- Commit mesajları: `feat:`, `fix:`, `chore:`, `refactor:` prefix'li.
- `.env` asla commit'lenmez. Repoda `.env.example` bulunur.

### Proje yönetimi
- GitHub Projects'te kanban: **Backlog → Bu Hafta → Yapılıyor → Bitti**
- Bu dosyadaki her görev (G1-1, G2-1...) birer **Issue** olsun, kanbana eklensin.
- Issue'ları kendi üstünüze assign edin — kim ne yapıyor net görünsün.

### Önerilen klasör yapısı
```
app/            → Expo Router ekranları
components/     → Ortak UI componentleri
lib/
  supabase.ts   → Supabase client
  api/          → Veri erişim fonksiyonları (moods.ts, children.ts, pairs.ts, care.ts)
hooks/          → Custom hook'lar (useRealtimeChild, useMoods...)
constants/      → Renkler, mod tanımları, evre eşikleri
supabase/
  migrations/   → SQL migration dosyaları
  functions/    → Edge Functions
```

---

## 8. Riskler & Notlar

- **Kurtarma yok — bu bilinçli bir risk.** Uygulama silinirse/cihaz değişirse erişim kaybolur. Onboarding'de kullanıcıya bu durum kısaca belirtilmeli ki sürpriz olmasın.
- **Kod çakışmasına karşı unique constraint.** Rastgele üretilen `pair_code`'un veritabanında `UNIQUE` olduğundan emin olun, üretim sırasında çakışma kontrolü (retry) yapın.
- **RLS'i baştan doğru kur.** Sonradan düzeltmesi acı verir. İlk hafta G1-3'e yeterince zaman ayır.
- **"3 çocuk" kuralını veritabanı seviyesinde uygula.** Sadece uygulama tarafında kontrol edip veritabanında serbest bırakırsanız, ileride tutarsızlık riski olur.
- **Yaş/büyüme sistemi için gerçek zaman mı, hızlandırılmış zaman mı kullanılacağına erken karar verin.** Gerçek 18 yıl beklemek anlamsız olur — örneğin "1 gerçek gün = X oyun günü" gibi bir oran belirleyip `birth_date` üzerinden hesaplamak mantıklı.
- **Decay için cron'a bulaşma (MVP'de).** Uygulama açılışında `last_decay_at` farkından hesapla, yeter.
- **Animasyonlarda mükemmeliyetçilik yapmayın.** LottieFiles'tan hazır ücretsiz animasyonlarla başlayın, karakter tasarımını v2'de özelleştirirsiniz.
- **Her hafta sonu iki telefonda gerçek test** — emülatörde her şey çalışır gibi görünür, push notification gerçek cihazda test edilir.
- **Kapsamı büyük görmeyin.** 3 çocuk + evlat edinme + kıyafet + anı defteri hepsi birden MVP'ye sığmaz; yukarıdaki sıralamayla adım adım gidin.

---

*Son güncelleme: 19 Temmuz 2026*
