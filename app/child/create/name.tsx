import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, ChildAvatar } from '@/components';
import { brand } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { createChild, type Gender } from '@/lib/api/children';

const NAME_MAX_LENGTH = 30;

export default function ChildNameScreen() {
  const { gender, hairColor, eyeColor, skinTone } = useLocalSearchParams<{
    gender: Gender;
    hairColor: string;
    eyeColor: string;
    skinTone: string;
  }>();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    const child = await createChild({
      name: trimmed,
      gender,
      traits: { hairColor, eyeColor, skinTone },
    });
    setLoading(false);

    router.replace({
      pathname: '/child/created',
      params: {
        name: child.name,
        gender: child.gender,
        hairColor: child.hairColor,
        eyeColor: child.eyeColor,
        skinTone: child.skinTone,
      },
    });
  }

  return (
    <View style={styles.container}>
      <ChildAvatar hairColor={hairColor} eyeColor={eyeColor} skinTone={skinTone} size={100} />

      <Text style={styles.title}>Adı ne olsun?</Text>
      <Text style={styles.body}>
        Bu isim, çocuğunuzun uygulama boyunca kullanılacak ismi olacak.
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="İsim yazın"
        placeholderTextColor={brand.inkMuted}
        maxLength={NAME_MAX_LENGTH}
        autoFocus
        style={styles.input}
      />

      <Button
        label="Oluştur"
        size="lg"
        onPress={handleSubmit}
        loading={loading}
        disabled={!name.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: brand.ink,
  },
  body: {
    ...typography.body,
    color: brand.inkMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.subtitle,
    width: '100%',
    color: brand.ink,
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
