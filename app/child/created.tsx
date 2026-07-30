import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, ChildAvatar } from '@/components';
import { brand } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { Gender } from '@/lib/api/children';

/**
 * Çocuk oluşturma akışının sonu. G2-6 tamamlandığı için artık burası
 * kısa bir kutlama durağı — kullanıcıyı asıl ana ekrana (G2-6) yönlendirir.
 */
export default function ChildCreatedScreen() {
  const { name, gender, hairColor, eyeColor, skinTone } = useLocalSearchParams<{
    name: string;
    gender: Gender;
    hairColor: string;
    eyeColor: string;
    skinTone: string;
  }>();

  return (
    <View style={styles.container}>
      <ChildAvatar hairColor={hairColor} eyeColor={eyeColor} skinTone={skinTone} size={120} />
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>{name} ailenize katıldı!</Text>
      <Text style={styles.body}>Şimdi ona göz kulak olma zamanı.</Text>

      <Button
        label="Ana ekrana git"
        size="lg"
        onPress={() =>
          router.replace({
            pathname: '/child/home',
            params: { name, gender, hairColor, eyeColor, skinTone },
          })
        }
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
});
