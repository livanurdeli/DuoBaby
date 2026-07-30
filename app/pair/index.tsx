import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

/**
 * Geçici yer tutucu — eşleşme + kod ekranları (G2-4) burada
 * geliştirilecek. Şimdilik sadece "Başla" butonunun bir yere
 * gittiğini göstermek için var.
 */
export default function PairScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eşleşme ekranı</Text>
      <Text style={styles.body}>G2-4&apos;te burası doldurulacak.</Text>
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
  title: {
    ...typography.title,
    color: brand.ink,
  },
  body: {
    ...typography.body,
    color: brand.inkMuted,
  },
});
