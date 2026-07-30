import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { ensureSession } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';

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

    ensureSession().then(async ({ userId }) => {
      if (!isMounted) return;

      try {
        // 1. Çift (pair) kaydı var mı kontrol et
        const { data: pairData, error: pairError } = await supabase
          .from('pairs')
          .select('*')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .maybeSingle();

        if (pairError) throw pairError;

        if (!pairData) {
          // Eşleşme yok -> onboarding karşılama ekranına git
          router.replace('/onboarding/welcome');
          return;
        }

        // 2. Eşleşme var ama tamamlanmış mı (user2_id dolmuş mu)?
        if (!pairData.user2_id) {
          // Eşleşme kodu oluşturulmuş ama partner henüz girmemiş -> Bekleme ekranına git
          router.replace('/pair/create' as any);
          return;
        }

        // 3. Eşleşme tamamlanmış. Aktif çocuk var mı kontrol et?
        const { data: childData, error: childError } = await supabase
          .from('children')
          .select('id')
          .eq('pair_id', pairData.id)
          .eq('status', 'active')
          .maybeSingle();

        if (childError) throw childError;

        if (childData) {
          // Çocuk var -> Ana ekrana git
          router.replace('/child/main' as any);
        } else {
          // Çocuk yok -> Çocuk oluşturma akışına git
          router.replace('/child/create/gender' as any);
        }
      } catch (error) {
        console.error('Status check error:', error);
        // Hata durumunda güvenli liman olarak onboarding'e git
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
