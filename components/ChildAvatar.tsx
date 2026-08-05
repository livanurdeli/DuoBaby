import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { brand } from '@/constants/colors';
import type { Expression } from '@/lib/api/care';

const SKIN_TONE_COLORS: Record<string, string> = {
  Açık: '#F4D3B6',
  Buğday: '#DBA876',
  Esmer: '#A06A45',
};

const HAIR_COLOR_COLORS: Record<string, string> = {
  Siyah: '#2B2320',
  Kahverengi: '#6B4A2F',
  Sarı: '#D9B36C',
  Kızıl: '#A24328',
};

const EYE_COLOR_COLORS: Record<string, string> = {
  Kahverengi: '#5B3A29',
  Yeşil: '#4F7A52',
  Mavi: '#3F6FA0',
  Ela: '#7A6A3F',
};

type ChildAvatarProps = {
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  size?: number;
  expression?: Expression;
};

const babySvg = require('../assets/baby.svg');
const babySadSvg = require('../assets/baby_sad_full.svg');

/**
 * Renders the high-quality baby SVG mascot using expo-image.
 * The shape-based avatar configurations are kept in props for compatibility.
 */
export function ChildAvatar({
  hairColor,
  eyeColor,
  skinTone,
  size = 140,
  expression = 'neutral',
}: ChildAvatarProps) {
  const isSad = expression === 'sad' || expression === 'sick';
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={isSad ? babySadSvg : babySvg}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});


