import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedCharacter, Bar, Button } from '@/components';
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

  const ORDERED_ACTIONS: CareAction[] = ['feed', 'sleep', 'clean', 'play'];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.name}>{name || 'Bebeğiniz'}</Text>

        <View style={styles.characterContainer}>
          {/* Merkezdeki Karakter (500 birim, mutlak ortalanmış) */}
          <View style={styles.characterWrap}>
            <AnimatedCharacter
              hairColor={hairColor}
              eyeColor={eyeColor}
              skinTone={skinTone}
              expression={expression}
              bouncePulse={bounceTick}
              size={500}
            />
          </View>

          {/* Sağ tarafta dikey sıralı 4 durum sütunu */}
          <View style={styles.rightBarsContainer}>
            <Bar label="🍼" value={stats.hunger} color={careColors.hunger} />
            <Bar label="🧼" value={stats.cleanliness} color={careColors.cleanliness} />
            <Bar label="😴" value={stats.energy} color={careColors.energy} />
            <Bar label="🧸" value={stats.happiness} color={careColors.happiness} />
          </View>
        </View>
      </ScrollView>

      {/* Eylem Butonları (Sayfanın en altında - Birleşik Bar Düzeni) */}
      <View style={styles.actionsGrid}>
        {ORDERED_ACTIONS.map((action, index) => (
          <Button
            key={action}
            icon={<Text style={styles.actionEmoji}>{ACTION_META[action].emoji}</Text>}
            variant="secondary"
            onPress={() => handleAction(action)}
            loading={pendingAction === action}
            disabled={pendingAction !== null && pendingAction !== action}
            style={[
              styles.actionButton,
              index > 0 ? styles.buttonBorder : undefined,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
  },
  content: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.lg,
  },
  name: {
    ...typography.display,
    color: brand.ink,
    marginTop: 4,
  },
  characterContainer: {
    width: '100%',
    height: 500,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: spacing.sm,
  },
  characterWrap: {
    position: 'absolute',
    width: 500,
    height: 500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBarsContainer: {
    position: 'absolute',
    right: spacing.xs,
    top: 20,
    bottom: 20,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  actionsGrid: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.forestMuted,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    paddingBottom: 24,
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  buttonBorder: {
    borderLeftWidth: 1,
    borderLeftColor: brand.border,
  },
  actionEmoji: {
    fontSize: 26,
  },
});
