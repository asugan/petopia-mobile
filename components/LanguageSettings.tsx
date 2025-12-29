import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useUserSettingsStore, getLanguageNativeName, SupportedLanguage } from '@/stores/userSettingsStore';
import { useTranslation } from 'react-i18next';

interface LanguageSettingsProps {
  showDeviceInfo?: boolean;
  variant?: 'card' | 'embedded';
}

export function LanguageSettings({
  showDeviceInfo = false,
  variant = 'card',
}: LanguageSettingsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { settings, updateSettings, isLoading } = useUserSettingsStore();

  const currentLanguage = settings?.language || 'en';
  const supportedLanguages: SupportedLanguage[] = ['tr', 'en'];

  const handleLanguageSelect = (language: SupportedLanguage) => {
    updateSettings({ language });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        variant === 'embedded' ? styles.containerEmbedded : null,
        { backgroundColor: variant === 'embedded' ? 'transparent' : theme.colors.surface },
      ]}
    >
      {/* Current Language Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('settings.currentLanguage')}
        </Text>
        <Text style={[styles.currentLanguage, { color: theme.colors.onSurface }]}>
          {getLanguageNativeName(currentLanguage)}
        </Text>
      </View>

      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t('settings.selectLanguage')}
        </Text>
        {supportedLanguages.map((language) => (
          <TouchableOpacity
            key={language}
            style={[
              styles.languageOption,
              {
                backgroundColor: currentLanguage === language ? theme.colors.primaryContainer : 'transparent',
                borderColor: theme.colors.outline,
              },
            ]}
            onPress={() => handleLanguageSelect(language)}
          >
            <Text
              style={[
                styles.languageText,
                {
                  color: currentLanguage === language ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                },
              ]}
            >
              {getLanguageNativeName(language)}
            </Text>
            {currentLanguage === language && (
              <Text style={[styles.checkmark, { color: theme.colors.primary }]}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  containerEmbedded: {
    padding: 0,
    margin: 0,
    borderRadius: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  currentLanguage: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
