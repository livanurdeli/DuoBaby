#!/bin/bash
# DuoBaby - Roadmap görevlerini GitHub Issue olarak toplu oluşturur.
# Kullanım: DuoBaby repo klasörünün içinde çalıştır: ./create_issues.sh

set -e

REPO="livanurdeli/DuoBaby"

# Her satır: "Başlık|Açıklama|Etiket"
issues=(
  "O-1: Şema tasarım oturumu|1 akşam beraber oturun, tabloları netleştirin (Hafta 1'in ilk işi)|ortak"
  "G1-1: Supabase projesi kurulumu|Proje aç, env yapısı, client config|backend"
  "G1-2: Şema + migration'lar|Tablolar, index'ler, UNIQUE constraint'ler|backend"
  "G1-3: RLS policy'leri|Pair bazlı erişim kuralları — en kritik iş|backend"
  "G1-4: Anonim auth akışı|Supabase anonymous auth entegrasyonu, session yönetimi|backend"
  "G1-5: Kod sistemi + eşleştirme|Rastgele kod üretme, kodla eşleşme, pair oluşturma|backend"
  "G1-6: Çocuk oluşturma logic'i|Cinsiyet seçimi + rastgele özellik ataması + isim kaydı|backend"
  "G1-7: Bakım logic'i|Aksiyon -> bar güncelleme, decay hesabı|backend"
  "G1-8: Büyüme/evre logic'i|birth_date'ten evre türetme, evre geçiş tetikleyicisi|backend"
  "G1-9: Streak hesabı|Günlük kontrol, seri artırma/sıfırlama|backend"
  "G1-10: Push notification|Expo push token kaydı, Edge Function ile tetikleme|backend"
  "G1-11: Realtime subscription'lar|Mod ve bakım değişikliklerini canlı dinleme|backend"
  "G2-1: Expo projesi kurulumu|TypeScript, Expo Router, temel klasör yapısı|frontend"
  "G2-2: Tasarım sistemi|Renk paleti, tipografi, ortak componentler|frontend"
  "G2-3: Onboarding ekranları|Karşılama ekranı, anonim oturum yükleme akışı|frontend"
  "G2-4: Eşleşme + kod ekranları|Kod göster / kod gir / kopyalama-paylaşma|frontend"
  "G2-5: Çocuk oluşturma ekranı|Cinsiyet seçimi + rastgele sonuç animasyonu + isim girişi|frontend"
  "G2-6: Ana ekran (çocuk ekranı)|Karakter, 4 bar, aksiyon butonları|frontend"
  "G2-7: Lottie animasyonları|Evrelere göre idle, mutlu, üzgün, yemek yeme animasyonları|frontend"
  "G2-8: Mod giriş ekranı|Renk seçici + not alanı|frontend"
  "G2-9: Mod takvimi|Aylık grid görünümü (GitHub contribution tarzı)|frontend"
  "G2-10: Bildirim UI|In-app bildirim listesi / toast'lar|frontend"
  "O-2: PR review süreci|Birbirinizin her PR'ını review edin|ortak"
  "O-3: Haftalık sync|Haftada 1 kısa toplantı|ortak"
  "O-4: Test|Her hafta sonu iki telefonda beraber test|ortak"
)

echo "Toplam ${#issues[@]} issue oluşturulacak, repo: $REPO"
echo ""

for entry in "${issues[@]}"; do
  IFS='|' read -r title body label <<< "$entry"

  # Etiket yoksa oluştur (varsa hata vermeden geçer)
  gh label create "$label" --repo "$REPO" --color "ededed" 2>/dev/null || true

  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    --label "$label"

  echo "✓ Oluşturuldu: $title"
done

echo ""
echo "Tamamlandı! GitHub'da Issues sekmesinden kontrol edebilirsin."
