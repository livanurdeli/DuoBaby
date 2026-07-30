import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '@/components';
import { brand } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

/**
 * Eşleşme akışının giriş ekranı (G2-4). Kullanıcı ya kendi kodunu
 * oluşturup partnerine gönderir, ya da partnerinin kodunu girer.
 */
export default function PairScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eşleşelim</Text>
      <Text style={styles.body}>
        Partnerinle bağlanmak için ikinizden biri bir kod oluşturmalı,
        diğeri de o kodu girmeli.
      </Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Henüz kimsede kod yok</Text>
        <Text style={styles.cardBody}>
          Sen bir kod oluştur, partnerine gönder.
        </Text>
        <Button
          label="Kod Oluştur"
          onPress={() => router.push('/pair/create')}
          style={styles.button}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Partnerimde kod var</Text>
        <Text style={styles.cardBody}>
          Sana gönderdiği 6 haneli kodu gir.
        </Text>
        <Button
          label="Kodu Gir"
          variant="secondary"
          onPress={() => router.push('/pair/join')}
          style={styles.button}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
    padding: spacing.xl,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    ...typography.display,
    color: brand.ink,
  },
  body: {
    ...typography.body,
    color: brand.inkMuted,
    marginBottom: spacing.md,
  },
  card: {
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.subtitle,
    color: brand.ink,
  },
  cardBody: {
    ...typography.body,
    color: brand.inkMuted,
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
});
