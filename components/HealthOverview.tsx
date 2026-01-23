import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePets } from '@/lib/hooks/usePets';
import type { HealthRecord } from '@/lib/types';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import MoneyDisplay from '@/components/ui/MoneyDisplay';
import { TAB_ROUTES } from '@/constants/routes';

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
  const router = useRouter();
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
  const healthItems = healthRecords.map((record) => ({
    _id: record._id,
    title: record.title || t(`health.types.${record.type}`, record.type),
    petId: record.petId,
    date: record.date,
    type: record.type,
    cost: record.cost,
    currency: record.currency,
    amountBase: record.amountBase,
  }));

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
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.emptyContent}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.tertiaryContainer }]}
          >
            <Ionicons name="heart" size={24} color={theme.colors.tertiary} />
          </View>
          <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            {t('home.healthOverviewEmptyTitle')}
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('home.healthOverviewEmptyDescription')}
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push(TAB_ROUTES.care)}
            buttonColor={theme.colors.tertiary}
            textColor={theme.colors.onTertiary}
            style={styles.emptyCta}
          >
            {t('home.healthOverviewEmptyCta')}
          </Button>
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
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  emptyCta: {
    alignSelf: 'center',
  },
});

export default HealthOverview;
