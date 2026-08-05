import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Card } from '@/components';
import { brand, mood as moodColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import {
  getMonthMoods,
  MOOD_LABELS,
  toDateKey,
  type MonthMoods,
  type Mood,
} from '@/lib/api/moods';
import { buildMonthCells } from '@/lib/calendar';

/**
 * Mod takvimi (G2-9). GitHub contribution grid'i gibi: her gün bir kutu,
 * kutunun üst yarısı senin modun, alt yarısı partnerinki. Bir güne
 * dokununca o günün notları altta açılır.
 */
const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export default function MoodCalendarScreen() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [data, setData] = useState<MonthMoods | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setSelectedDay(null);

    getMonthMoods(month)
      .then((result) => {
        if (isMounted) setData(result);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : 'Takvim yüklenemedi.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [month]);

  const cells = useMemo(() => buildMonthCells(month), [month]);

  const shiftMonth = (delta: number) =>
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  const isCurrentMonth =
    month.getFullYear() === new Date().getFullYear() &&
    month.getMonth() === new Date().getMonth();

  const selected = selectedDay ? data?.byDate[selectedDay] : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Button label="‹" variant="ghost" onPress={() => shiftMonth(-1)} />
        <Text style={styles.title}>
          {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
        </Text>
        <Button
          label="›"
          variant="ghost"
          onPress={() => shiftMonth(1)}
          disabled={isCurrentMonth}
        />
      </View>

      <View style={styles.weekdays}>
        {WEEKDAYS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={brand.forest} style={styles.spinner} />
      ) : (
        <View style={styles.grid}>
          {cells.map((date, index) => {
            if (!date) return <View key={`empty-${index}`} style={styles.cell} />;

            const key = toDateKey(date);
            const day = data?.byDate[key];

            return (
              <Pressable
                key={key}
                onPress={() => setSelectedDay(day ? key : null)}
                style={[styles.cell, selectedDay === key && styles.cellSelected]}
                accessibilityLabel={`${date.getDate()} ${MONTH_NAMES[month.getMonth()]}`}
              >
                <View style={styles.cellHalves}>
                  <View style={[styles.half, tint(day?.mine)]} />
                  <View style={[styles.half, tint(day?.partner)]} />
                </View>
                <Text style={styles.cellDay}>{date.getDate()}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {selected && (
        <Card style={styles.detail}>
          <Text style={styles.detailTitle}>{selectedDay}</Text>
          <MoodLine label="Sen" entry={selected.mine} />
          <MoodLine label="Partnerin" entry={selected.partner} />
        </Card>
      )}

      <Text style={styles.legend}>
        Her kutunun üst yarısı senin modun, alt yarısı partnerinin.
      </Text>
    </ScrollView>
  );
}

function tint(entry?: Mood) {
  return { backgroundColor: entry ? moodColors[entry.color] : brand.border };
}

function MoodLine({ label, entry }: { label: string; entry?: Mood }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {entry ? (
        <View style={styles.detailValue}>
          <View style={[styles.dot, { backgroundColor: moodColors[entry.color] }]} />
          <Text style={styles.detailMood}>
            {MOOD_LABELS[entry.color]}
            {entry.note ? ` — ${entry.note}` : ''}
          </Text>
        </View>
      ) : (
        <Text style={styles.detailEmpty}>giriş yok</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.title,
    color: brand.ink,
  },
  weekdays: {
    flexDirection: 'row',
  },
  weekday: {
    ...typography.caption,
    color: brand.inkMuted,
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  cellSelected: {
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: brand.ink,
  },
  cellHalves: {
    flex: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  half: {
    flex: 1,
  },
  cellDay: {
    ...typography.caption,
    color: brand.inkMuted,
    textAlign: 'center',
  },
  spinner: {
    marginVertical: spacing.xxl,
  },
  detail: {
    gap: spacing.sm,
  },
  detailTitle: {
    ...typography.caption,
    color: brand.inkMuted,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.bodyBold,
    color: brand.ink,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
  },
  detailMood: {
    ...typography.body,
    color: brand.ink,
    flexShrink: 1,
  },
  detailEmpty: {
    ...typography.body,
    color: brand.inkMuted,
  },
  legend: {
    ...typography.caption,
    color: brand.inkMuted,
    textAlign: 'center',
  },
  error: {
    ...typography.body,
    color: brand.danger,
  },
});
