/**
 * Renk paleti
 * ------------------------------------------------------------------
 * Tema: "birlikte büyütülen bir yaşam" — sıcak ama sakin, çocuksu ama
 * yapmacık olmayan bir "fidanlık/doğa" hissi. Ekranda üç ayrı renk
 * sistemi bir arada yaşıyor, birbirine karışmasınlar diye kasıtlı
 * olarak farklı sıcaklıkta tutuldu:
 *
 *  1. `brand`  → arayüzün kendi kimliği (buton, link, arka plan)
 *  2. `mood`   → roadmap'te tanımlı, KULLANICIYA ait günlük mod rengi
 *  3. `care`   → çocuğun 4 bakım barına ait, mood'dan bağımsız kimlik
 *
 * `mood` ve `care` renk isimleri roadmap'e göre sabit; hex değerleri
 * burada `brand` paletiyle uyumlu olacak şekilde seçildi.
 */

export const brand = {
  paper: '#F3F5EE', // ana arka plan — sıcak, hafif yeşilimsi kağıt tonu
  surface: '#FFFEFB', // kart/panel arka planı (paper'dan bir tık daha açık)
  ink: '#24302B', // ana metin rengi (siyah değil, koyu orman tonu)
  inkMuted: '#5F6B63', // ikincil metin, açıklama
  forest: '#3F6652', // ana marka rengi — buton, aktif link, seçili durum
  forestMuted: '#DCE6DD', // forest'ın açık tonu — arka plan vurgusu, seçili chip
  honey: '#E8A63D', // ikincil vurgu — streak, kutlama, öne çıkan aksiyon
  border: '#E4E7DE', // ince çizgiler, kart kenarlığı
  danger: '#C1483F', // hata / kritik uyarı (barlar çok düşükken vb.)
} as const;

/**
 * Mod renkleri — roadmap'teki 7 kategori (bkz. docs/roadmap.md, bölüm 1).
 * Bunlar kullanıcının günlük ruh haline ait, çocuğun bakım barlarıyla
 * karıştırılmamalı.
 */
export const mood = {
  green: '#6B9C7D', // Çok mutlu
  orange: '#D99A5B', // Orta
  red: '#C15B53', // Kötü
  pink: '#C97BA0', // Özlemiş, görmek istiyor
  purple: '#8C79B5', // Sıkılmış
  yellow: '#D4B24A', // Heyecanlı
  blue: '#6089AD', // Üzgün
} as const;

export type MoodColor = keyof typeof mood;

/**
 * Bakım barı renkleri — her metrik sabit bir renge sahip, kullanıcı
 * zamanla "turuncu = açlık" diye ezberlesin diye tutarlı tutuluyor.
 */
export const care = {
  hunger: '#E0954A', // açlık — sıcak amber (yemek)
  cleanliness: '#4C94B8', // temizlik — su mavisi
  energy: '#8A6FB0', // enerji — dinlenme moru
  happiness: '#D46C86', // mutluluk — gül pembesi
} as const;

export type CareMetric = keyof typeof care;

// Geriye dönük uyumluluk / kısayol: eski MOOD_COLORS adını kullanan
// kod varsa bozulmasın diye bırakıldı.
export const MOOD_COLORS = mood;

export const colors = { ...brand, mood, care };

export default colors;
