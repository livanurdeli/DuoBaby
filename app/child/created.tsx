import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components';
import { brand } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

/**
 * Çocuk oluşturma akışının sonu. G2-6 (ana ekran) bitene kadar
 * akışın gideceği son durak burası.
 */
export default function ChildCreatedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👶</Text>
      <Text style={styles.title}>Çocuğunuz oluştu!</Text>
      <Text style={styles.body}>
        Ana ekran (karakter, bakım barları) hazırlandı!
      </Text>
      <Button
        label="Çocuğumuzun Ekranına Git"
        size="lg"
        onPress={() => router.replace('/child/main' as any)}
        style={styles.cta}
      />
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
  cta: {
    marginTop: spacing.xl,
    width: '100%',
  },
});
