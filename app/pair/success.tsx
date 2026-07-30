import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

/**
 * Eşleşme tamamlandığında gösterilen ekran. G2-5 (çocuk oluşturma)
 * yapılana kadar akışın sonu burası.
 */
export default function PairSuccessScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Eşleştiniz!</Text>
      <Text style={styles.body}>
        Artık birlikte bir çocuğa bakmaya hazırsınız. Sıradaki adım —
        çocuğunuzu oluşturmak — yakında burada olacak.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.display,
    color: brand.ink,
  },
  body: {
    ...typography.body,
    color: brand.inkMuted,
    textAlign: 'center',
  },
});
