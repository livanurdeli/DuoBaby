import { StyleSheet, View } from 'react-native';

import { brand } from '@/constants/colors';

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
};

/**
 * Basit, katmanlı şekillerle çizilmiş bir yüz — dış görsel/asset
 * gerektirmiyor. G2-7'de Lottie animasyonları gelince bu, evre 0
 * (henüz doğmamış/oluşturuluyor) için bir yer tutucu/önizleme olarak
 * kalabilir.
 */
export function ChildAvatar({
  hairColor,
  eyeColor,
  skinTone,
  size = 140,
}: ChildAvatarProps) {
  const skin = SKIN_TONE_COLORS[skinTone] ?? SKIN_TONE_COLORS.Açık;
  const hair = HAIR_COLOR_COLORS[hairColor] ?? HAIR_COLOR_COLORS.Siyah;
  const eye = EYE_COLOR_COLORS[eyeColor] ?? EYE_COLOR_COLORS.Kahverengi;

  const eyeSize = size * 0.09;
  const eyeOffsetX = size * 0.2;
  const eyeOffsetY = size * 0.44;

  return (
    <View style={{ width: size, height: size }}>
      {/* Yüz */}
      <View
        style={[
          styles.face,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: skin,
          },
        ]}
      />
      {/* Saç */}
      <View
        style={[
          styles.hair,
          {
            width: size * 0.92,
            height: size * 0.5,
            borderRadius: size * 0.46,
            backgroundColor: hair,
            top: -size * 0.06,
            left: size * 0.04,
          },
        ]}
      />
      {/* Gözler */}
      <View
        style={[
          styles.eye,
          {
            width: eyeSize,
            height: eyeSize,
            borderRadius: eyeSize / 2,
            backgroundColor: eye,
            top: eyeOffsetY,
            left: size / 2 - eyeOffsetX - eyeSize / 2,
          },
        ]}
      />
      <View
        style={[
          styles.eye,
          {
            width: eyeSize,
            height: eyeSize,
            borderRadius: eyeSize / 2,
            backgroundColor: eye,
            top: eyeOffsetY,
            left: size / 2 + eyeOffsetX - eyeSize / 2,
          },
        ]}
      />
      {/* Ağız */}
      <View
        style={[
          styles.mouth,
          {
            width: size * 0.22,
            height: size * 0.06,
            borderRadius: size * 0.03,
            backgroundColor: brand.ink,
            top: size * 0.64,
            left: size / 2 - size * 0.11,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
  },
  hair: {
    position: 'absolute',
  },
  eye: {
    position: 'absolute',
  },
  mouth: {
    position: 'absolute',
    opacity: 0.7,
  },
});
