import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Bar, Button, Card, ChildAvatar } from '@/components';
import { brand, care } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { ensureSession } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { performCareAction } from '@/lib/api/children';
import type { Child, Gender, LifeStage } from '@/lib/api/children';

const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  baby: 'Bebek Evresi',
  child: 'Çocuk Evresi',
  teen: 'Ergen Evresi',
  adult: 'Yetişkin Evresi',
};

export default function ChildMainScreen() {
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Geçici ifade (aksiyon sonrası geri bildirim için)
  const [tempExpression, setTempExpression] = useState<'happy' | 'sad' | 'sleeping' | 'neutral' | null>(null);

  // Aksiyon butonlarının ayrı loading durumları
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({
    feed: false,
    clean: false,
    sleep: false,
    play: false,
  });

  useEffect(() => {
    let isMounted = true;
    let channel: any;

    async function fetchChildData() {
      try {
        const { userId } = await ensureSession();

        // 1. Kullanıcının ait olduğu çifti (pair) bul
        const { data: pairData, error: pairError } = await supabase
          .from('pairs')
          .select('id')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .maybeSingle();

        if (pairError) throw pairError;

        if (!pairData) {
          router.replace('/pair');
          return;
        }

        // 2. Bu çifte ait aktif çocuğu bul
        const { data: childData, error: childError } = await supabase
          .from('children')
          .select('*')
          .eq('pair_id', pairData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (childError) throw childError;

        if (isMounted) {
          if (childData) {
            setChild({
              id: childData.id,
              name: childData.name,
              gender: childData.gender as Gender,
              hairColor: childData.hair_color,
              eyeColor: childData.eye_color,
              skinTone: childData.skin_tone,
              lifeStage: childData.life_stage as LifeStage,
              hunger: childData.hunger,
              cleanliness: childData.cleanliness,
              energy: childData.energy,
              happiness: childData.happiness,
            });

            // Gerçek zamanlı güncellemeleri dinlemek için realtime kanal oluştur
            channel = supabase
              .channel(`child-changes-${childData.id}`)
              .on(
                'postgres_changes',
                {
                  event: 'UPDATE',
                  schema: 'public',
                  table: 'children',
                  filter: `id=eq.${childData.id}`,
                },
                (payload) => {
                  if (!isMounted) return;
                  const newChild = payload.new;
                  setChild({
                    id: newChild.id,
                    name: newChild.name,
                    gender: newChild.gender as Gender,
                    hairColor: newChild.hair_color,
                    eyeColor: newChild.eye_color,
                    skinTone: newChild.skin_tone,
                    lifeStage: newChild.life_stage as LifeStage,
                    hunger: newChild.hunger,
                    cleanliness: newChild.cleanliness,
                    energy: newChild.energy,
                    happiness: newChild.happiness,
                  });
                }
              )
              .subscribe();
          } else {
            // Aktif çocuk yoksa oluşturma ekranına yönlendir
            router.replace('/child/create/gender');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message ?? 'Veriler yüklenirken bir hata oluştu.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchChildData();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const getExpression = (): 'happy' | 'sad' | 'sleeping' | 'neutral' => {
    if (tempExpression) return tempExpression;
    if (!child) return 'neutral';

    // Barlardan herhangi biri <= 20 ise üzgün (ihmal durumu)
    if (
      child.hunger <= 20 ||
      child.cleanliness <= 20 ||
      child.energy <= 20 ||
      child.happiness <= 20
    ) {
      return 'sad';
    }

    // Barların hepsi >= 70 ise mutlu
    if (
      child.hunger >= 70 &&
      child.cleanliness >= 70 &&
      child.energy >= 70 &&
      child.happiness >= 70
    ) {
      return 'happy';
    }

    return 'neutral';
  };

  const handleCareAction = async (actionType: 'feed' | 'clean' | 'sleep' | 'play') => {
    if (!child) return;

    setActionLoading((prev) => ({ ...prev, [actionType]: true }));

    // Aksiyona uygun geçici ifadeyi başlat
    const targetTempExpression = actionType === 'sleep' ? 'sleeping' : 'happy';
    setTempExpression(targetTempExpression);

    // 3 saniye sonra geçici ifadeyi varsayılana sıfırla
    const timer = setTimeout(() => {
      setTempExpression(null);
    }, 3000);

    try {
      const currentValueMap = {
        feed: child.hunger,
        clean: child.cleanliness,
        sleep: child.energy,
        play: child.happiness,
      };

      const newValue = await performCareAction(child.id, actionType, currentValueMap[actionType]);

      // Yerel state'i de anında güncelle
      setChild((prev) => {
        if (!prev) return null;
        const fieldMap = {
          feed: 'hunger',
          clean: 'cleanliness',
          sleep: 'energy',
          play: 'happiness',
        } as const;
        return {
          ...prev,
          [fieldMap[actionType]]: newValue,
        };
      });
    } catch (err: any) {
      console.error('Care action failed:', err);
      // Hata oluşursa geçici ifadeyi temizle
      setTempExpression(null);
      clearTimeout(timer);
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionType]: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={brand.forest} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (error || !child) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error ?? 'Çocuk bulunamadı.'}</Text>
        <Button label="Tekrar Dene" onPress={() => router.replace('/')} style={styles.retryBtn} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Üst Kısım: Başlık & Karakter */}
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>{child.name}</Text>
        <Text style={styles.stageText}>{LIFE_STAGE_LABELS[child.lifeStage]}</Text>
      </View>

      <View style={styles.avatarContainer}>
        <ChildAvatar
          hairColor={child.hairColor}
          eyeColor={child.eyeColor}
          skinTone={child.skinTone}
          expression={getExpression()}
          size={160}
        />
      </View>

      {/* Orta Kısım: Bakım Barları */}
      <Card style={styles.statsCard}>
        <Text style={styles.cardTitle}>Bakım Durumu</Text>
        <View style={styles.barList}>
          <Bar label="🍼 Açlık" value={child.hunger} color={care.hunger} />
          <Bar label="🧼 Temizlik" value={child.cleanliness} color={care.cleanliness} />
          <Bar label="😴 Enerji" value={child.energy} color={care.energy} />
          <Bar label="🧸 Mutluluk" value={child.happiness} color={care.happiness} />
        </View>
      </Card>

      {/* Alt Kısım: Hızlı Aksiyonlar */}
      <View style={styles.actionsGrid}>
        <View style={styles.actionRow}>
          <Button
            label="Besle 🍼"
            onPress={() => handleCareAction('feed')}
            loading={actionLoading.feed}
            disabled={Object.values(actionLoading).some(Boolean)}
            style={styles.actionBtn}
          />
          <Button
            label="Temizle 🧼"
            onPress={() => handleCareAction('clean')}
            loading={actionLoading.clean}
            disabled={Object.values(actionLoading).some(Boolean)}
            style={styles.actionBtn}
          />
        </View>
        <View style={styles.actionRow}>
          <Button
            label="Uyut 😴"
            onPress={() => handleCareAction('sleep')}
            loading={actionLoading.sleep}
            disabled={Object.values(actionLoading).some(Boolean)}
            style={styles.actionBtn}
          />
          <Button
            label="Oyna 🧸"
            onPress={() => handleCareAction('play')}
            loading={actionLoading.play}
            disabled={Object.values(actionLoading).some(Boolean)}
            style={styles.actionBtn}
          />
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: brand.paper,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: brand.inkMuted,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: brand.danger,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryBtn: {
    width: '60%',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  welcomeTitle: {
    ...typography.display,
    color: brand.ink,
  },
  stageText: {
    ...typography.subtitle,
    color: brand.forest,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  statsCard: {
    padding: spacing.lg,
  },
  cardTitle: {
    ...typography.title,
    color: brand.ink,
    marginBottom: spacing.md,
  },
  barList: {
    gap: spacing.md,
  },
  actionsGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
