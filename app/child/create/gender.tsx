import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { Gender } from '@/lib/api/children';

type Option = { gender: Gender; label: string; emoji: string };

const OPTIONS: Option[] = [
  { gender: 'female', label: 'Kız', emoji: '👧' },
  { gender: 'male', label: 'Erkek', emoji: '👦' },
];

export default function ChildGenderScreen() {
  function handleSelect(gender: Gender) {
    router.push({ pathname: '/child/create/reveal', params: { gender } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bir çocuğunuz olacak</Text>
      <Text style={styles.body}>Cinsiyetini seçin.</Text>

      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.gender}
            onPress={() => handleSelect(option.gender)}
            style={({ pressed }) => [
              styles.option,
              pressed && styles.optionPressed,
            ]}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text style={styles.optionLabel}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
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
  options: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  option: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  optionPressed: {
    backgroundColor: brand.forestMuted,
    borderColor: brand.forest,
  },
  emoji: {
    fontSize: 48,
  },
  optionLabel: {
    ...typography.subtitle,
    color: brand.ink,
  },
});
