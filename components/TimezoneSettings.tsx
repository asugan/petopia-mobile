import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ListItem } from '@/components/ui/List';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/theme';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import {
  detectDeviceTimezone,
  formatTimezoneLabel,
  getSupportedTimezones,
} from '@/lib/utils/timezone';

interface TimezoneSettingsProps {
  variant?: 'card' | 'embedded';
  onSelect?: (timezone: string) => void;
  selectedTimezone?: string;
}

export function TimezoneSettings({
  variant = 'card',
  onSelect,
  selectedTimezone: externalSelectedTimezone,
}: TimezoneSettingsProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { settings, updateSettings, isLoading } = useUserSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const currentTimezone =
    externalSelectedTimezone || settings?.timezone || detectDeviceTimezone();

  const supportedTimezones = useMemo(() => getSupportedTimezones(), []);

  const filteredTimezones = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return supportedTimezones;
    }

    return supportedTimezones.filter((timezone) => {
      const normalized = timezone.toLowerCase();
      const pretty = formatTimezoneLabel(timezone).toLowerCase();
      return normalized.includes(query) || pretty.includes(query);
    });
  }, [searchValue, supportedTimezones]);

  const handleTimezoneSelect = (timezone: string) => {
    if (onSelect) {
      onSelect(timezone);
    } else {
      void updateSettings({ timezone });
    }

    setIsModalOpen(false);
    setSearchValue('');
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
      <ListItem
        title={t('settings.timezone', 'Timezone')}
        description={formatTimezoneLabel(currentTimezone)}
        left={<Ionicons name="time-outline" size={24} color={theme.colors.onSurfaceVariant} />}
        right={<Ionicons name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />}
        onPress={() => setIsModalOpen(true)}
      />

      <Modal visible={isModalOpen} onDismiss={() => setIsModalOpen(false)}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {t('settings.selectTimezone', 'Select Timezone')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchValue('');
                setIsModalOpen(false);
              }}
            >
              <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchContainer,
              { borderBottomColor: theme.colors.outline, backgroundColor: theme.colors.surface },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.colors.onSurfaceVariant} />
            <TextInput
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder={t('common.search', 'Search')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              style={[styles.searchInput, { color: theme.colors.onSurface }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView style={styles.timezoneList} showsVerticalScrollIndicator={false}>
            {filteredTimezones.map((timezone, index) => {
              const isSelected = currentTimezone === timezone;
              return (
                <TouchableOpacity
                  key={timezone}
                  style={[
                    styles.timezoneOption,
                    {
                      backgroundColor: isSelected ? theme.colors.primaryContainer : 'transparent',
                      borderBottomWidth: index < filteredTimezones.length - 1 ? 1 : 0,
                      borderBottomColor: theme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => handleTimezoneSelect(timezone)}
                >
                  <View style={styles.timezoneInfo}>
                    <Text
                      variant="bodyLarge"
                      style={{
                        color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {formatTimezoneLabel(timezone)}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: isSelected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {timezone}
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
    maxHeight: 560,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  timezoneList: {
    maxHeight: 460,
  },
  timezoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  timezoneInfo: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
});
