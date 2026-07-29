/**
 * Tipografi
 * ------------------------------------------------------------------
 * İki yazı ailesi kasıtlı olarak farklı karakterde eşleştirildi:
 *
 *  - Baloo 2  → başlıklar, çocuğun ismi, büyük sayılar. Yuvarlak,
 *               oyuncu, "elle çizilmiş" hissi veren bir display font —
 *               bu bir bebek/çocuk büyütme uygulaması, sistem
 *               fontuyla soğuk durmasın istedik.
 *  - Nunito   → gövde metni, açıklamalar. Baloo 2 ile aynı yuvarlak
 *               aile hissini taşıyor ama uzun metinlerde yorulmuyor.
 *
 * Fontlar `app/_layout.tsx` içinde `useFonts` ile yükleniyor
 * (paket: @expo-google-fonts/baloo-2, @expo-google-fonts/nunito).
 * Yüklenene kadar `fontFamily` alanları `undefined` döner ve
 * React Native otomatik olarak sistem fontuna düşer — yani font
 * yüklenmeden önce de ekran kırılmaz.
 */
import {
  useFonts as useBaloo2Fonts,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
} from '@expo-google-fonts/baloo-2';
import {
  useFonts as useNunitoFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

export const fontFamilies = {
  displayMedium: 'Baloo2_500Medium',
  displaySemiBold: 'Baloo2_600SemiBold',
  displayBold: 'Baloo2_700Bold',
  bodyRegular: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
} as const;

/** app/_layout.tsx içinde çağrılacak tek hook — iki font ailesini birleştirir. */
export function useAppFonts() {
  const [baloo2Loaded] = useBaloo2Fonts({
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
  });
  const [nunitoLoaded] = useNunitoFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  return baloo2Loaded && nunitoLoaded;
}

/**
 * Adlandırılmış tip skalası. Her rol; boyut, ağırlık ve harf aralığını
 * birlikte taşır, böylece bileşenlerde tekrar tekrar aynı üçlüyü
 * yazmak yerine tek bir `typography.title` gibi referans kullanılır.
 */
export const typography = {
  display: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamilies.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  bodyBold: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
} as const;

export default typography;
