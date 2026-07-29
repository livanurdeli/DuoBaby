import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sayfa bulunamadı' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Bu sayfa mevcut değil.</Text>
        <Link href="/" style={styles.link}>
          Ana sayfaya dön
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
    color: '#2e78b7',
  },
});
