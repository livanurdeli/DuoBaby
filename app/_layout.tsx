import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { brand } from '@/constants/colors';
import { useAppFonts } from '@/constants/typography';

// Fontlar yüklenene kadar splash screen'i açık tut.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: brand.paper },
        }}
      />
      <StatusBar style="dark" />
    </>
  );
}
