import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import { useUserSettingsStore, getLanguageNativeName } from '@/stores/userSettingsStore';
import type { SupportedLanguage } from '@/stores/userSettingsStore';
import { useTranslation } from 'react-i18next';
import { ListItem } from '@/components/ui/List';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';

interface LanguageSettingsProps {
  showDeviceInfo?: boolean;
  variant?: 'card' | 'embedded';
}

// Dil bayrakları
const languageFlags: Record<SupportedLanguage, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  it: '🇮🇹',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  pt: '🇵🇹',
  ja: '🇯🇵',
  ko: '🇰🇷',
  ru: '🇷🇺',
  ar: '🇸🇦',
};

export function LanguageSettings({
  showDeviceInfo = false,
  variant = 'card',
}: LanguageSettingsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { settings, updateSettings, isLoading } = useUserSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentLanguage = settings?.language || 'en';
  const supportedLanguages: SupportedLanguage[] = ['tr', 'en', 'it', 'de', 'fr', 'es', 'pt', 'ja', 'ko', 'ru', 'ar'];

  const handleLanguageSelect = (language: SupportedLanguage) => {
    updateSettings({ language });
    setIsModalOpen(false);
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
      {/* Kapalı Durum - Tıklanabilir ListItem */}
      <ListItem
        title={t('settings.language', 'Language')}
        description={`${languageFlags[currentLanguage]} ${getLanguageNativeName(currentLanguage)}`}
        left={
          <Ionicons
            name="language"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        }
        right={
          <Ionicons
            name="chevron-down"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        }
        onPress={() => setIsModalOpen(true)}
      />

      {/* Modal - Dil Seçimi */}
      <Modal
        visible={isModalOpen}
        onDismiss={() => setIsModalOpen(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {t('settings.selectLanguage', 'Select Language')}
            </Text>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Dil Listesi */}
          <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
            {supportedLanguages.map((language, index) => {
              const isSelected = currentLanguage === language;
              return (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.languageOption,
                    {
                      backgroundColor: isSelected ? theme.colors.primaryContainer : 'transparent',
                      borderBottomWidth: index < supportedLanguages.length - 1 ? 1 : 0,
                      borderBottomColor: theme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => handleLanguageSelect(language)}
                >
                  <View style={styles.languageContent}>
                    <Text style={styles.flag}>{languageFlags[language]}</Text>
                    <Text
                      variant="bodyLarge"
                      style={{
                        color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {getLanguageNativeName(language)}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
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
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalContent: {
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: 480,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  languageList: {
    maxHeight: 400,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 24,
  },
});
