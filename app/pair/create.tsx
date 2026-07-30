import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { Button, Card } from '@/components';
import { brand } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { generatePairCode, waitForPartner } from '@/lib/api/pairing';

type Status = 'generating' | 'ready' | 'joined';

export default function CreatePairScreen() {
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('generating');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    generatePairCode().then((newCode) => {
      if (!isMounted) return;
      setCode(newCode);
      setStatus('ready');

      waitForPartner(newCode).then(() => {
        if (!isMounted) return;
        setStatus('joined');
        router.replace('/pair/success');
      }).catch((err) => {
        console.error('waitForPartner error:', err);
      });
    }).catch((err) => {
      if (!isMounted) return;
      console.error('generatePairCode error:', err);
      if (err?.message?.includes('Zaten bir esin var')) {
        // Zaten eşleşmişse doğrudan başarı ekranına yönlendir
        router.replace('/pair/success' as any);
      } else {
        alert(err?.message ?? 'Kod oluşturulamadı.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCopy() {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!code) return;
    await Share.share({
      message: `DuoBaby'de eşleşmek için bu kodu gir: ${code}`,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kodun hazır</Text>
      <Text style={styles.body}>
        Bu kodu partnerine gönder, karşı tarafta bu kodu girsin.
      </Text>

      <Card style={styles.codeCard}>
        {status === 'generating' || !code ? (
          <ActivityIndicator color={brand.forest} />
        ) : (
          <Text style={styles.code}>{code}</Text>
        )}
      </Card>

      <View style={styles.actions}>
        <Button
          label={copied ? 'Kopyalandı ✓' : 'Kopyala'}
          variant="secondary"
          onPress={handleCopy}
          disabled={!code}
          style={styles.actionButton}
        />
        <Button
          label="Paylaş"
          onPress={handleShare}
          disabled={!code}
          style={styles.actionButton}
        />
      </View>

      {status === 'ready' && (
        <View style={styles.waiting}>
          <ActivityIndicator color={brand.inkMuted} />
          <Text style={styles.waitingText}>
            Partnerinin girmesini bekliyoruz...
          </Text>
        </View>
      )}
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
  codeCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  code: {
    ...typography.display,
    fontSize: 40,
    letterSpacing: 8,
    color: brand.forest,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  waitingText: {
    ...typography.caption,
    color: brand.inkMuted,
  },
});
