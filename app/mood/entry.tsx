import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button, Card } from '@/components';
import { brand, mood as moodColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import {
  getTodayMoods,
  MOOD_LABELS,
  MOOD_ORDER,
  NOTE_MAX_LENGTH,
  saveTodayMood,
  type Mood,
  type MoodColor,
} from '@/lib/api/moods';
import { useRealtimePartnerMood } from '@/hooks/useRealtime';

/**
 * Günlük mod girişi (G2-8). Aynı gün tekrar girilirse üstüne yazılır —
 * `moods_one_per_day` constraint'i zaten tek kayıt garantiliyor, ekran da
 * bunu "düzeltme" gibi sunuyor.
 */
export default function MoodEntryScreen() {
  const [selected, setSelected] = useState<MoodColor | null>(null);
  const [note, setNote] = useState('');
  const [partner, setPartner] = useState<Mood | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getTodayMoods()
      .then((moods) => {
        if (!isMounted) return;
        if (moods.mine) {
          setSelected(moods.mine.color);
          setNote(moods.mine.note ?? '');
        }
        setPartner(moods.partner);
        setUserId(moods.userId);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : 'Modlar yüklenemedi.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Partner ekran açıkken modunu girerse/değiştirirse kart anında güncellensin.
  useRealtimePartnerMood(userId, (row) => {
    setPartner({
      userId: row.user_id,
      color: row.color,
      note: row.note,
      date: row.date,
    });
  });

  async function handleSave() {
    if (!selected) return;

    setSaving(true);
    setError(null);
    try {
      await saveTodayMood({ color: selected, note });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mod kaydedilemedi.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={brand.forest} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bugün nasılsın?</Text>
      <Text style={styles.body}>
        Bir renk seç, istersen tek cümleyle anlat. Partnerin bunu görecek.
      </Text>

      <View style={styles.swatches}>
        {MOOD_ORDER.map((color) => (
          <Pressable
            key={color}
            onPress={() => setSelected(color)}
            style={[
              styles.swatch,
              { backgroundColor: moodColors[color] },
              selected === color && styles.swatchSelected,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === color }}
            accessibilityLabel={MOOD_LABELS[color]}
          />
        ))}
      </View>

      <Text style={styles.selectedLabel}>
        {selected ? MOOD_LABELS[selected] : 'Henüz seçmedin'}
      </Text>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Tek cümleyle nasıl geçti? (isteğe bağlı)"
        placeholderTextColor={brand.inkMuted}
        maxLength={NOTE_MAX_LENGTH}
        multiline
        style={styles.input}
      />

      {partner && (
        <Card style={styles.partnerCard}>
          <Text style={styles.partnerTitle}>Partnerinin bugünü</Text>
          <View style={styles.partnerRow}>
            <View
              style={[styles.partnerDot, { backgroundColor: moodColors[partner.color] }]}
            />
            <Text style={styles.partnerLabel}>{MOOD_LABELS[partner.color]}</Text>
          </View>
          {partner.note && <Text style={styles.partnerNote}>{partner.note}</Text>}
        </Card>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        label="Kaydet"
        size="lg"
        onPress={handleSave}
        loading={saving}
        disabled={!selected}
      />
    </ScrollView>
  );
}

const SWATCH_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.display,
    color: brand.ink,
  },
  body: {
    ...typography.body,
    color: brand.inkMuted,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: brand.ink,
  },
  selectedLabel: {
    ...typography.subtitle,
    color: brand.ink,
  },
  input: {
    ...typography.body,
    minHeight: 88,
    color: brand.ink,
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    textAlignVertical: 'top',
  },
  partnerCard: {
    gap: spacing.sm,
  },
  partnerTitle: {
    ...typography.caption,
    color: brand.inkMuted,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  partnerDot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
  },
  partnerLabel: {
    ...typography.bodyBold,
    color: brand.ink,
  },
  partnerNote: {
    ...typography.body,
    color: brand.inkMuted,
  },
  error: {
    ...typography.body,
    color: brand.danger,
  },
});
