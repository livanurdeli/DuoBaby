import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components';
import { brand } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

/**
 * Karşılama ekranı (G2-3). Anonim oturum `app/index.tsx` içinde arka
 * planda zaten kurulmuş oluyor; burada kullanıcıya ne olduğunu kısaca
 * anlatıp eşleşme akışına (G2-4, `/pair`) yönlendiriyoruz.
 */
export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.motif} pointerEvents="none">
        <View style={[styles.circle, styles.circleForest]} />
        <View style={[styles.circle, styles.circleHoney]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>DuoBaby</Text>
        <Text style={styles.tagline}>Birlikte büyütün.</Text>
        <Text style={styles.body}>
          Sevdiğin biriyle ortak bir çocuğa bakın: besleyin, temizleyin,
          büyümesini birlikte izleyin. Karşı tarafın yaptığı her şeyi
          anında görürsünüz.
        </Text>

        <Button
          label="Başla"
          size="lg"
          onPress={() => router.push('/pair')}
          style={styles.cta}
        />

        <Text style={styles.note}>
          Hesap oluşturmana gerek yok. Ama dikkat: uygulamayı silersen ya
          da cihazını değiştirirsen bu çocuğa erişimini kaybedersin.
        </Text>
      </View>
    </View>
  );
}

const CIRCLE_SIZE = 220;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
  },
  motif: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    height: CIRCLE_SIZE + 60,
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    opacity: 0.16,
  },
  circleForest: {
    backgroundColor: brand.forest,
    left: '50%',
    marginLeft: -CIRCLE_SIZE * 0.62,
  },
  circleHoney: {
    backgroundColor: brand.honey,
    left: '50%',
    marginLeft: -CIRCLE_SIZE * 0.38,
    top: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  title: {
    ...typography.display,
    color: brand.ink,
  },
  tagline: {
    ...typography.subtitle,
    color: brand.forest,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: brand.inkMuted,
    marginBottom: spacing.lg,
  },
  cta: {
    marginBottom: spacing.md,
  },
  note: {
    ...typography.caption,
    color: brand.inkMuted,
    textAlign: 'center',
  },
});
