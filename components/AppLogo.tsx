import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '@/components/ui';

export function AppLogo() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
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
