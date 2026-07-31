import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { ChildAvatar } from './ChildAvatar';
import type { Expression } from '@/lib/api/care';

type AnimatedCharacterProps = {
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  expression: Expression;
  size?: number;
  /** Aksiyon butonuna basıldığında dıştan tetiklenen "sevinme zıplaması". */
  bouncePulse?: number;
};

/**
 * G2-7'de gerçek Lottie karakteri gelene kadar, mevcut şekil tabanlı
 * `ChildAvatar`'ı sarmalayıp ona HAREKET katan bileşen. Bilinçli tasarım
 * kararı: ifadeyi (mutlu/üzgün/hasta) bir *çizim* değişikliğiyle değil,
 * bir *hareket tarzı* değişikliğiyle anlatıyoruz — çünkü asıl görsel zaten
 * yakında değişecek, ama "hareket sarmalayıcısı" aynı kalıp Lottie
 * component'ini de sarmalayabilecek.
 *
 *  - happy   → hızlı, keyifli, biraz yüksek zıplama
 *  - neutral → yavaş, sakin nefes alma
 *  - sad     → çok yavaş, düşük genlikli, hafif çökük duruş
 *  - sick    → küçük, düzensiz bir titreme
 */
export function AnimatedCharacter({
  hairColor,
  eyeColor,
  skinTone,
  expression,
  size = 180,
  bouncePulse = 0,
}: AnimatedCharacterProps) {
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Dıştan gelen aksiyon (besle/temizle/uyut/oyna) tetiklendiğinde küçük
  // bir "pop" zıplaması.
  useEffect(() => {
    if (bouncePulse === 0) return;

    Animated.sequence([
      Animated.timing(pulseScale, {
        toValue: 1.12,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(pulseScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bouncePulse]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={{
          transform: [
            { scale: pulseScale },
          ],
        }}
      >
        <ChildAvatar
          hairColor={hairColor}
          eyeColor={eyeColor}
          skinTone={skinTone}
          size={size}
          expression={expression}
        />
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
