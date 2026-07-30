import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components';
import { brand } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { joinWithCode } from '@/lib/api/pairing';

const CODE_LENGTH = 6;

export default function JoinPairScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(text: string) {
    setError(null);
    setCode(text.toUpperCase().slice(0, CODE_LENGTH));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const result = await joinWithCode(code);

    setLoading(false);

    if (result.success) {
      router.replace('/pair/success');
    } else {
      setError(result.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kodu gir</Text>
      <Text style={styles.body}>
        Partnerinin sana gönderdiği 6 haneli kodu yaz.
      </Text>

      <TextInput
        value={code}
        onChangeText={handleChange}
        placeholder="ABC123"
        placeholderTextColor={brand.inkMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={CODE_LENGTH}
        style={[styles.input, !!error && styles.inputError]}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        label="Katıl"
        onPress={handleSubmit}
        loading={loading}
        disabled={code.length !== CODE_LENGTH}
        size="lg"
      />
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
    ...typography.title,
    color: brand.ink,
  },
  body: {
    ...typography.body,
    color: brand.inkMuted,
  },
  input: {
    ...typography.display,
    fontSize: 32,
    letterSpacing: 8,
    textAlign: 'center',
    color: brand.ink,
    backgroundColor: brand.surface,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  inputError: {
    borderColor: brand.danger,
  },
  error: {
    ...typography.caption,
    color: brand.danger,
    textAlign: 'center',
  },
});
