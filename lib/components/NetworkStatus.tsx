import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface NetworkStatusProps {
  children: React.ReactNode;
}

export function NetworkStatus({ children }: NetworkStatusProps) {
  const netInfo = useNetInfo();
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (netInfo.isConnected === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.errorContainer }]}>
        <Text style={[styles.message, { color: theme.colors.onErrorContainer }]}>
          📵 {t('network.noConnection')}
        </Text>
        {children}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
});