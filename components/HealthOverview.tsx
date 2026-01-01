import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { usePets } from '@/lib/hooks/usePets';
import type { HealthRecord } from '@/lib/types';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import MoneyDisplay from '@/components/ui/MoneyDisplay';

interface HealthOverviewProps {
  healthRecords?: HealthRecord[];
  loading?: boolean;
}

const HealthOverview: React.FC<HealthOverviewProps> = ({
  healthRecords = [],
  loading,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { data: pets } = usePets();
  const { settings } = useUserSettingsStore();
  const baseCurrency = settings?.baseCurrency || 'TRY';

  // Get pet name by id
  const getPetName = (petId: string) => {
    const pet = pets?.find(p => p._id === petId);
    return pet?.name || '';
  };

  // Format date to DD.MM.YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Determine icon and color based on record type
  const getIconInfo = (type: string) => {
    switch (type) {
      case 'checkup':
        return { name: 'fitness' as const, color: '#00ADB5' }; // Teal
      case 'visit':
        return { name: 'pulse' as const, color: '#FF9F1C' }; // Orange
      case 'surgery':
        return { name: 'bandage' as const, color: '#E74C3C' }; // Red
      case 'dental':
        return { name: 'happy' as const, color: '#3498DB' }; // Blue
      case 'grooming':
        return { name: 'cut' as const, color: '#F39C12' }; // Yellow
      default:
        return { name: 'document-text' as const, color: '#7F8C8D' }; // Gray
    }
  };

  // Map health records for display (already sorted and limited by hook)
  const healthItems = healthRecords.map((record) => {
    const recordAny = record as Record<string, unknown>;
    return {
      _id: record._id,
      title: record.title || t(`health.types.${record.type}`, record.type),
      petId: record.petId,
      date: record.date,
      type: record.type,
      cost: record.cost,
      currency: recordAny.currency as string | undefined,
      amountBase: recordAny.amountBase as number | undefined,
    };
  });

  if (loading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: '#4B5563' }]}>
        <View style={styles.content}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            {t('home.healthOverview')}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('common.loading')}
          </Text>
        </View>
      </Card>
    );
  }

  if (healthItems.length === 0) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: '#4B5563' }]}>
        <View style={styles.content}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            {t('home.healthOverview')}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('health.noRecords')}
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: '#4B5563' }]}>
      <View style={styles.content}>
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('home.healthOverview')}
        </Text>

        <View style={styles.list}>
          {healthItems.map((item) => {
            const iconInfo = getIconInfo(item.type);
            const petName = getPetName(item.petId);

            return (
              <View key={item._id} style={styles.healthItem}>
                <View style={[styles.iconCircle, { backgroundColor: iconInfo.color + '33' }]}>
                  <Ionicons name={iconInfo.name} size={20} color={iconInfo.color} />
                </View>
                <View style={styles.healthInfo}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    {item.title}{petName ? ` - ${petName}` : ''}
                  </Text>
                  <MoneyDisplay
                    amount={item.cost}
                    currency={item.currency}
                    baseCurrency={baseCurrency}
                    amountBase={item.amountBase}
                    size="small"
                  />
                </View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatDate(item.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  content: {
    padding: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthInfo: {
    flex: 1,
  },
});

export default HealthOverview;
