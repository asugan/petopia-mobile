import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui';

export function AppLogo() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <Text variant="titleLarge" style={styles.text}>
        Petopia
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    width: 36,
    height: 36,
  },
  text: {
    fontWeight: '700',
  },
});

export default AppLogo;
