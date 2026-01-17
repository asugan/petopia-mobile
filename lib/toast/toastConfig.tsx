import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { Text } from '@/components/ui';
import { Theme } from '@/lib/theme';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type ToastVisual = {
  accentColor: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
};

const getToastVisuals = (theme: Theme): Record<ToastVariant, ToastVisual> => ({
  success: {
    accentColor: theme.colors.success,
    iconName: 'check-circle-outline',
  },
  error: {
    accentColor: theme.colors.error,
    iconName: 'alert-circle-outline',
  },
  info: {
    accentColor: theme.colors.info,
    iconName: 'information-outline',
  },
  warning: {
    accentColor: theme.colors.warning,
    iconName: 'alert-outline',
  },
});

const ToastCard = ({
  text1,
  text2,
  theme,
  accentColor,
  iconName,
}: {
  text1?: string;
  text2?: string;
  theme: Theme;
  accentColor: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
}) => {
  const styles = createStyles(theme);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.content}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${accentColor}1F` }]}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={19}
            color={accentColor}
          />
        </View>
        <View style={styles.textWrap}>
          {text1 ? (
            <Text
              variant="titleSmall"
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {text1}
            </Text>
          ) : null}
          {text2 ? (
            <Text
              variant="bodySmall"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={3}
            >
              {text2}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export const createToastConfig = (theme: Theme): ToastConfig => {
  const visuals = getToastVisuals(theme);

  const renderToast = (
    params: ToastConfigParams<unknown>,
    variant: ToastVariant
  ) => {
    const { text1, text2 } = params;
    const { accentColor, iconName } = visuals[variant];

    return (
      <ToastCard
        text1={text1}
        text2={text2}
        theme={theme}
        accentColor={accentColor}
        iconName={iconName}
      />
    );
  };

  return {
    success: (params) => renderToast(params, 'success'),
    error: (params) => renderToast(params, 'error'),
    info: (params) => renderToast(params, 'info'),
    warning: (params) => renderToast(params, 'warning'),
  };
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      width: '90%',
      maxWidth: 520,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
      shadowColor: theme.colors.onSurface,
      shadowOpacity: 0.14,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
      alignSelf: 'center',
    },
    accent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      borderTopLeftRadius: 18,
      borderBottomLeftRadius: 18,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 18,
      paddingLeft: 22,
      gap: 12,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
    },
    title: {
      fontWeight: '700',
    },
    subtitle: {
      marginTop: 2,
      lineHeight: 18,
    },
  });
