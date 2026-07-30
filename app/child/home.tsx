import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedCharacter, Bar, Button, Card } from '@/components';
import { brand, care as careColors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { Gender } from '@/lib/api/children';
import {
  ACTION_META,
  applyCareAction,
  applyDemoDecay,
  DEFAULT_CARE_STATS,
  getExpression,
  logCareAction,
  type CareAction,
  type CareStats,
} from '@/lib/api/care';

// Geliştirme/test amaçlı: barların ne kadar sürede biraz düşeceği.
// Gerçek decay G1-7'de last_decay_at üzerinden hesaplanacak, bu SADECE
// ekranı boş barlarla da test edebilmek için var.
const DEMO_DECAY_INTERVAL_MS = 15000;

export default function ChildHomeScreen() {
  const { name, gender, hairColor, eyeColor, skinTone } = useLocalSearchParams<{
    name: string;
    gender: Gender;
    hairColor: string;
    eyeColor: string;
    skinTone: string;
  }>();

  const [stats, setStats] = useState<CareStats>(DEFAULT_CARE_STATS);
  const [pendingAction, setPendingAction] = useState<CareAction | null>(null);
  const bouncePulse = useRef(0);
  const [bounceTick, setBounceTick] = useState(0);

  const expression = getExpression(stats);

  // Demo decay — sadece geliştirme sırasında barların hareket ettiğini
  // görmek için. G1-7 gelince bu efekt tamamen kaldırılacak.
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => applyDemoDecay(prev));
    }, DEMO_DECAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  async function handleAction(action: CareAction) {
    if (pendingAction) return; // aynı anda tek aksiyon

    setPendingAction(action);
    setStats((prev) => applyCareAction(prev, action));

    bouncePulse.current += 1;
    setBounceTick(bouncePulse.current);

    // childId henüz yok (G1-6 backend'e bağlanınca gelecek) — mock id.
    await logCareAction('mock-child-id', action);
    setPendingAction(null);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.name}>{name || 'Bebeğiniz'}</Text>

      <View style={styles.characterWrap}>
        <AnimatedCharacter
          hairColor={hairColor}
          eyeColor={eyeColor}
          skinTone={skinTone}
          expression={expression}
          bouncePulse={bounceTick}
          size={200}
        />
      </View>

      <Card style={styles.barsCard}>
        <Bar label="Açlık" value={stats.hunger} color={careColors.hunger} />
        <Bar
          label="Temizlik"
          value={stats.cleanliness}
          color={careColors.cleanliness}
          style={styles.barSpacing}
        />
        <Bar
          label="Enerji"
          value={stats.energy}
          color={careColors.energy}
          style={styles.barSpacing}
        />
        <Bar
          label="Mutluluk"
          value={stats.happiness}
          color={careColors.happiness}
          style={styles.barSpacing}
        />
      </Card>

      <View style={styles.actionsGrid}>
        {(Object.keys(ACTION_META) as CareAction[]).map((action) => (
          <Button
            key={action}
            label={ACTION_META[action].label}
            icon={<Text style={styles.actionEmoji}>{ACTION_META[action].emoji}</Text>}
            variant="secondary"
            onPress={() => handleAction(action)}
            loading={pendingAction === action}
            disabled={pendingAction !== null && pendingAction !== action}
            style={styles.actionButton}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  name: {
    ...typography.display,
    color: brand.ink,
  },
  characterWrap: {
    marginVertical: spacing.sm,
  },
  barsCard: {
    width: '100%',
  },
  barSpacing: {
    marginTop: spacing.md,
  },
  actionsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: '45%',
  },
  actionEmoji: {
    fontSize: 18,
  },
});
