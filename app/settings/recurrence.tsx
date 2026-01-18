import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, Card, IconButton, ActivityIndicator, Chip } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useRecurrenceRules, useDeleteRecurrenceRule, useUpdateRecurrenceRule } from '@/lib/hooks/useRecurrence';
import { usePets } from '@/lib/hooks/usePets';
import { getEventTypeLabel, getEventTypeIcon } from '@/constants/eventIcons';
import { getEventColor } from '@/lib/utils/eventColors';
import { showToast } from '@/lib/toast/showToast';
import { RecurrenceRule } from '@/lib/schemas/recurrenceSchema';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecurrenceManagementScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { data, isLoading, refetch, isRefetching } = useRecurrenceRules();
  const { data: pets = [] } = usePets();
  const deleteRuleMutation = useDeleteRecurrenceRule();
  const updateRuleMutation = useUpdateRecurrenceRule();

  const rules = data || [];

  const handleDelete = (id: string) => {
    deleteRuleMutation.mutate(id, {
      onSuccess: () => showToast({ type: 'success', title: t('serviceResponse.recurrence.deleteSuccess') }),
    });
  };

  const toggleActive = (rule: RecurrenceRule) => {
    updateRuleMutation.mutate({
      id: rule._id,
      data: { isActive: !rule.isActive }
    });
  };

  const renderRule = ({ item }: { item: RecurrenceRule }) => {
    const pet = pets.find(p => p._id === item.petId);
    const color = getEventColor(item.type, theme);
    const typeLabel = getEventTypeLabel(item.type, t);
    const icon = getEventTypeIcon(item.type);

    return (
      <Card style={styles.ruleCard}>
        <View style={styles.ruleHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Text style={styles.typeIcon}>{icon}</Text>
          </View>
          <View style={styles.ruleInfo}>
            <Text variant="titleMedium">{item.title}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {pet?.name} • {typeLabel}
            </Text>
          </View>
          <IconButton 
            icon={item.isActive ? "pause" : "play"} 
            onPress={() => toggleActive(item)}
            iconColor={item.isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        </View>
        
        <View style={styles.ruleDetails}>
          <Chip compact style={styles.chip}>
            {t(`recurrence.frequency.${item.frequency}`)}
          </Chip>
          {item.dailyTimes?.map((time, idx) => (
            <Chip key={idx} compact mode="outlined" style={styles.chip}>
              {time}
            </Chip>
          ))}
        </View>

        <View style={styles.ruleActions}>
          <IconButton 
            icon="delete-outline" 
            iconColor={theme.colors.error} 
            onPress={() => handleDelete(item._id)} 
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: t('recurrence.settings'), headerShown: true }} />
      
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={rules}
          renderItem={renderRule}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="bodyLarge">{t('common.noData')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  ruleCard: {
    padding: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 24,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingLeft: 60,
  },
  chip: {
    height: 24,
  },
  ruleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  }
});
