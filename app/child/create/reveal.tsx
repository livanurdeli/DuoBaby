import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ChildAvatar } from '@/components';
import { brand } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { randomizeTraits, type Gender, type Traits } from '@/lib/api/children';

const CYCLE_INTERVAL_MS = 90;
const CYCLE_DURATION_MS = 1400;

export default function ChildRevealScreen() {
  const { gender } = useLocalSearchParams<{ gender: Gender }>();

  const [cycling, setCycling] = useState<Traits>(randomizeTraits());
  const [settled, setSettled] = useState(false);
  const [finalTraits, setFinalTraits] = useState<Traits | null>(null);
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setCycling(randomizeTraits());
    }, CYCLE_INTERVAL_MS);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      const result = randomizeTraits();
      setFinalTraits(result);
      setSettled(true);
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }, CYCLE_DURATION_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const traits = finalTraits ?? cycling;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {settled ? 'İşte bu!' : 'Özellikleri belirleniyor...'}
      </Text>

      <Animated.View style={{ transform: [{ scale: settled ? scale : 1 }] }}>
        <ChildAvatar
          hairColor={traits.hairColor}
          eyeColor={traits.eyeColor}
          skinTone={traits.skinTone}
          size={160}
        />
      </Animated.View>

      <Card style={styles.traitsCard}>
        <TraitRow label="Saç rengi" value={traits.hairColor} />
        <TraitRow label="Göz rengi" value={traits.eyeColor} />
        <TraitRow label="Ten rengi" value={traits.skinTone} />
      </Card>

      {settled && (
        <Button
          label="Devam et"
          size="lg"
          onPress={() =>
            router.push({
              pathname: '/child/create/name',
              params: {
                gender,
                hairColor: traits.hairColor,
                eyeColor: traits.eyeColor,
                skinTone: traits.skinTone,
              },
            })
          }
        />
      )}
    </View>
  );
}

function TraitRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.traitRow}>
      <Text style={styles.traitLabel}>{label}</Text>
      <Text style={styles.traitValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
    color: brand.ink,
  },
  traitsCard: {
    width: '100%',
    gap: spacing.sm,
  },
  traitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  traitLabel: {
    ...typography.body,
    color: brand.inkMuted,
  },
  traitValue: {
    ...typography.bodyBold,
    color: brand.ink,
  },
});
