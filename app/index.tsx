import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { ensureSession } from '@/lib/api/auth';

/**
 * Uygulama girişi. Burada ekranda görünür bir şey yaptırmıyoruz —
 * sadece anonim oturumun (şimdilik mock) hazır olmasını bekleyip
 * karşılama ekranına yönlendiriyoruz. İleride burada "zaten eşleşmiş
 * mi, çocuğu var mı" gibi kontroller eklenip doğrudan ilgili ekrana
 * yönlendirme yapılacak.
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

    ensureSession().then(() => {
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
