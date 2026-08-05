import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedCharacter, Bar, Button } from '@/components';
import { brand, care as careColors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import {
  gameAgeYears,
  LIFE_STAGE_LABELS,
  type Gender,
  type LifeStage,
} from '@/lib/api/children';
import { useRealtimeChild } from '@/hooks/useRealtime';
import {
  ACTION_META,
  applyCareAction,
  DEFAULT_CARE_STATS,
  getExpression,
  performCareAction,
  syncChild,
  type CareAction,
  type CareStats,
} from '@/lib/api/care';

export default function ChildHomeScreen() {
  const { childId, name, gender, birthDate, hairColor, eyeColor, skinTone } =
    useLocalSearchParams<{
      childId: string;
      name: string;
      gender: Gender;
      birthDate: string;
      hairColor: string;
      eyeColor: string;
      skinTone: string;
    }>();

  const [stats, setStats] = useState<CareStats>(DEFAULT_CARE_STATS);
  const [lifeStage, setLifeStage] = useState<LifeStage>('baby');
  const [pendingAction, setPendingAction] = useState<CareAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bouncePulse = useRef(0);
  const [bounceTick, setBounceTick] = useState(0);

  const expression = getExpression(stats);

  // Ekran açılışında birikmiş decay'i sunucuda işlet ve gerçek değerleri al.
  useEffect(() => {
    if (!childId) return;
    let isMounted = true;

    syncChild(childId)
      .then((fresh) => {
        if (!isMounted) return;
        setStats(fresh.stats);
        setLifeStage(fresh.lifeStage);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : 'Bakım durumu alınamadı.');
      });

    return () => {
      isMounted = false;
    };
  }, [childId]);

  // Partner bakım yapınca barlar kendiliğinden güncellensin.
  // Kendi aksiyonumuz da olay olarak döner; RPC'nin döndürdüğü değerle
  // aynı satır olduğu için çakışma olmuyor.
  useRealtimeChild(childId, (row) => {
    setStats({
      hunger: row.hunger,
      cleanliness: row.cleanliness,
      energy: row.energy,
      happiness: row.happiness,
    });
    setLifeStage(row.life_stage);
  });

  async function handleAction(action: CareAction) {
    if (pendingAction) return; // aynı anda tek aksiyon

    setPendingAction(action);
    setError(null);

    // Optimistic: bar hemen hareket etsin. Sunucudan dönen değer geçerli olan.
    const optimistic = applyCareAction(stats, action);
    setStats(optimistic);

    bouncePulse.current += 1;
    setBounceTick(bouncePulse.current);

    try {
      const fresh = await performCareAction(childId, action);
      setStats(fresh.stats);
      setLifeStage(fresh.lifeStage);
    } catch (err) {
      setStats(stats); // sunucu reddetti, optimistic değeri geri al
      setError(err instanceof Error ? err.message : 'Aksiyon uygulanamadı.');
    } finally {
      setPendingAction(null);
    }
  }

  const ORDERED_ACTIONS: CareAction[] = ['feed', 'sleep', 'clean', 'play'];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.name}>{name || 'Bebeğiniz'}</Text>

        <Text style={styles.stage}>
          {LIFE_STAGE_LABELS[lifeStage]}
          {birthDate ? ` · ${gameAgeYears(birthDate)} yaşında` : ''}
        </Text>

        <Button
          label="Bugünkü modun"
          variant="ghost"
          onPress={() => router.push('/mood/entry')}
        />

        {error && <Text style={styles.error}>{error}</Text>}


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
  stage: {
    ...typography.caption,
    color: brand.inkMuted,
  },
  error: {
    ...typography.body,
    color: brand.danger,
    textAlign: 'center',
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
