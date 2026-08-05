import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { getRecentEvents, type AppEvent } from '@/lib/api/notifications';

/**
 * Bildirim listesi (G2-10). Kaynak ayrı bir tablo değil, olup biten
 * olayların kendisi: bakım aksiyonları + mod girişleri.
 */
export default function NotificationsScreen() {
  const { childName } = useLocalSearchParams<{ childName?: string }>();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getRecentEvents(childName || undefined)
      .then((rows) => {
        if (isMounted) setEvents(rows);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : 'Bildirimler yüklenemedi.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [childName]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={brand.forest} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olup bitenler</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Henüz bir şey olmadı. Çocuğunuzla ilgilenmeye başlayın 🍼
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.rowText, item.mine && styles.rowMine]}>{item.text}</Text>
            <Text style={styles.rowTime}>{formatTime(item.at)}</Text>
          </View>
        )}
      />
    </View>
  );
}

/** "3 saat önce" gibi kaba bir görecelik — kütüphane getirmeye değmez. */
function formatTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;

  return `${Math.floor(hours / 24)} gün önce`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
    padding: spacing.lg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.display,
    color: brand.ink,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  row: {
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 14,
    padding: spacing.md,
    gap: 2,
  },
  rowText: {
    ...typography.body,
    color: brand.ink,
  },
  rowMine: {
    color: brand.inkMuted,
  },
  rowTime: {
    ...typography.caption,
    color: brand.inkMuted,
  },
  empty: {
    ...typography.body,
    color: brand.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  error: {
    ...typography.body,
    color: brand.danger,
  },
});
