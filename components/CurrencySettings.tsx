import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import {
  useUserSettingsStore,
  getCurrencyDisplayName,
  getCurrencyFlag,
  getCurrencySymbol,
} from '@/stores/userSettingsStore';
import type { SupportedCurrency } from '@/stores/userSettingsStore';
import { useTranslation } from 'react-i18next';
import { ListItem } from '@/components/ui/List';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { CURRENCIES } from '@/lib/schemas/core/constants';

interface CurrencySettingsProps {
  variant?: 'card' | 'embedded';
  onSelect?: (currency: SupportedCurrency) => void;
  selectedCurrency?: SupportedCurrency;
}

export function CurrencySettings({
  variant = 'card',
  onSelect,
  selectedCurrency: externalSelectedCurrency,
}: CurrencySettingsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { settings, isLoading } = useUserSettingsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentCurrency = externalSelectedCurrency || settings?.baseCurrency || 'TRY';
  const supportedCurrencies: SupportedCurrency[] = [...CURRENCIES];

  const handleCurrencySelect = (currency: SupportedCurrency) => {
    if (onSelect) {
      onSelect(currency);
    }
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
        title={t('settings.currency', 'Currency')}
        description={`${getCurrencyFlag(currentCurrency)} ${getCurrencyDisplayName(currentCurrency)} (${getCurrencySymbol(currentCurrency)})`}
        left={
          <Ionicons
            name="cash-outline"
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

      {/* Modal - Para Birimi Seçimi */}
      <Modal
        visible={isModalOpen}
        onDismiss={() => setIsModalOpen(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {t('settings.selectCurrency', 'Select Currency')}
            </Text>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <Ionicons name="close" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Para Birimi Listesi */}
          <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
            {supportedCurrencies.map((currency, index) => {
              const isSelected = currentCurrency === currency;
              return (
                <TouchableOpacity
                  key={currency}
                  style={[
                    styles.currencyOption,
                    {
                      backgroundColor: isSelected ? theme.colors.primaryContainer : 'transparent',
                      borderBottomWidth: index < supportedCurrencies.length - 1 ? 1 : 0,
                      borderBottomColor: theme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => handleCurrencySelect(currency)}
                >
                  <View style={styles.currencyContent}>
                    <Text style={styles.flag}>{getCurrencyFlag(currency)}</Text>
                    <View style={styles.currencyInfo}>
                      <Text
                        variant="bodyLarge"
                        style={{
                          color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                          fontWeight: isSelected ? '600' : '400',
                        }}
                      >
                        {getCurrencyDisplayName(currency)}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{
                          color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                        }}
                      >
                        {currency} • {getCurrencySymbol(currency)}
                      </Text>
                    </View>
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
    maxHeight: 400,
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
  currencyList: {
    maxHeight: 320,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  currencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyInfo: {
    flexDirection: 'column',
    gap: 2,
  },
  flag: {
    fontSize: 24,
  },
});
