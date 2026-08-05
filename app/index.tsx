import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { ensureSession } from '@/lib/api/auth';
import { checkPairingStatus } from '@/lib/api/pairing';

/**
 * Uygulama girişi. Oturumun hazır olmasını bekler, ardından kullanıcının
 * eşleşme durumuna göre dinamik yönlendirme yapar:
 *  - Eşleşmişse: Doğrudan çocuk oluşturmaya gider
 *  - Kod oluşturmuş bekliyorsa: Kod ekranına gider
 *  - Eşleşmemişse: Karşılama ekranına gider
 */
export default function AppEntry() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    let isMounted = true;

    ensureSession()
      .then(() => checkPairingStatus())
      .then((pairing) => {
        if (!isMounted) return;
        if (pairing.status === 'paired') {
          router.replace('/child/create/gender');
        } else if (pairing.status === 'pending') {
          router.replace('/pair/create');
        } else {
          router.replace('/onboarding/welcome');
        }
      })
      .catch((err) => {
        console.error('Initial status check failed:', err);
        if (isMounted) {
          router.replace('/onboarding/welcome');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fade]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity: fade }]}>
        DuoBaby
      </Animated.Text>
      <ActivityIndicator color={brand.forest} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.display,
    color: brand.ink,
  },
  spinner: {
    marginTop: 24,
  },
});
