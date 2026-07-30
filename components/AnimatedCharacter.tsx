import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

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
  const idle = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const idleLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // İfadeye göre idle animasyon döngüsünü (yeniden) başlat.
  useEffect(() => {
    idleLoopRef.current?.stop();
    idle.setValue(0);

    const config = IDLE_CONFIG[expression];
    const loop = Animated.loop(
      Animated.sequence(
        config.pattern.map((step) =>
          Animated.timing(idle, {
            toValue: step.to,
            duration: step.duration,
            easing: step.easing,
            useNativeDriver: true,
          })
        )
      )
    );

    idleLoopRef.current = loop;
    loop.start();

    return () => loop.stop();
  }, [expression, idle]);

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

  const config = IDLE_CONFIG[expression];

  const translateY = idle.interpolate({
    inputRange: [0, 1],
    outputRange: [config.baseOffset, config.baseOffset - config.amplitude],
  });
  const rotate = idle.interpolate({
    inputRange: [0, 1],
    outputRange: [`${-config.tilt}deg`, `${config.tilt}deg`],
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={{
          transform: [
            { translateY },
            { rotate },
            { scale: pulseScale },
          ],
        }}
      >
        <ChildAvatar
          hairColor={hairColor}
          eyeColor={eyeColor}
          skinTone={skinTone}
          size={size}
        />
      </Animated.View>

      {/* G2-7'ye kadar geçici ifade rozeti — gerçek animasyon geldiğinde kaldırılacak. */}
      <View style={styles.badge}>
        <Text style={styles.badgeEmoji}>{EXPRESSION_EMOJI[expression]}</Text>
      </View>
    </View>
  );
}

const EXPRESSION_EMOJI: Record<Expression, string> = {
  happy: '😄',
  neutral: '🙂',
  sad: '😢',
  sick: '🤒',
};

type IdleStep = { to: number; duration: number; easing: (v: number) => number };
type IdleConfig = {
  baseOffset: number;
  amplitude: number;
  tilt: number;
  pattern: IdleStep[];
};

const EASE = Easing.inOut(Easing.sin);

const IDLE_CONFIG: Record<Expression, IdleConfig> = {
  happy: {
    baseOffset: 0,
    amplitude: 14,
    tilt: 3,
    pattern: [
      { to: 1, duration: 380, easing: EASE },
      { to: 0, duration: 380, easing: EASE },
    ],
  },
  neutral: {
    baseOffset: 0,
    amplitude: 6,
    tilt: 1,
    pattern: [
      { to: 1, duration: 900, easing: EASE },
      { to: 0, duration: 900, easing: EASE },
    ],
  },
  sad: {
    baseOffset: 4,
    amplitude: 3,
    tilt: 0.5,
    pattern: [
      { to: 1, duration: 1500, easing: EASE },
      { to: 0, duration: 1500, easing: EASE },
    ],
  },
  sick: {
    baseOffset: 0,
    amplitude: 3,
    tilt: 2,
    pattern: [
      { to: 1, duration: 70, easing: Easing.linear },
      { to: 0, duration: 70, easing: Easing.linear },
      { to: 1, duration: 70, easing: Easing.linear },
      { to: 0, duration: 90, easing: Easing.linear },
    ],
  },
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 4,
  },
  badgeEmoji: {
    fontSize: 28,
  },
});
