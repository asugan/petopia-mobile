import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { AppLogo } from './AppLogo';

interface CustomTabHeaderProps {
  pageTitle?: string;
}

export default function CustomTabHeader({ pageTitle }: CustomTabHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* App Logo - Left */}
      <View style={styles.left}>
        <AppLogo />
      </View>

      {/* Page Title - Right */}
      <View style={styles.right}>
        {pageTitle && (
          <Text
            variant="titleMedium"
            style={[styles.pageTitle, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {pageTitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    height: 56,
  },
  left: {
    alignItems: 'flex-start',
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
    flex: 1,
    minWidth: 100,
  },
  pageTitle: {
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'right',
  },
});
