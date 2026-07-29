import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bar, Button, Card } from '@/components';
import { brand, care } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

/**
 * Geçici önizleme ekranı — tasarım sistemini (renk/tipografi/Button/
 * Card/Bar) gözle doğrulamak için. Gerçek ana ekran G2-6'da bunun
 * yerini alacak.
 */
export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>DuoBaby</Text>
      <Text style={styles.subtitle}>Tasarım sistemi önizlemesi</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Miço</Text>
        <View style={styles.bars}>
          <Bar label="Açlık" value={72} color={care.hunger} />
          <Bar label="Temizlik" value={45} color={care.cleanliness} />
          <Bar label="Enerji" value={16} color={care.energy} />
          <Bar label="Mutluluk" value={90} color={care.happiness} />
        </View>
      </Card>

      <View style={styles.buttons}>
        <Button label="Besle" onPress={() => {}} variant="primary" />
        <Button label="Temizle" onPress={() => {}} variant="secondary" />
        <Button label="Vazgeç" onPress={() => {}} variant="ghost" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: brand.paper,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.display,
    color: brand.ink,
  },
  subtitle: {
    ...typography.body,
    color: brand.inkMuted,
    marginTop: -spacing.sm,
  },
  card: {
    marginTop: spacing.md,
  },
  cardTitle: {
    ...typography.title,
    color: brand.ink,
    marginBottom: spacing.lg,
  },
  bars: {
    gap: spacing.md,
  },
  buttons: {
    gap: spacing.md,
  },
});
