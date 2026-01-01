import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FAB, SegmentedButtons, Text } from '@/components/ui';
import { PetPickerBase } from '@/components/PetPicker';
import { ProtectedRoute } from '@/components/subscription';
import { FeedingScheduleCard } from '@/components/feeding/FeedingScheduleCard';
import { useTheme } from '@/lib/theme';
import { usePets } from '@/lib/hooks/usePets';
import { useHealthRecords } from '@/lib/hooks/useHealthRecords';
import {
  useAllFeedingSchedules,
  useDeleteFeedingSchedule,
  useToggleFeedingSchedule,
} from '@/lib/hooks/useFeedingSchedules';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { HealthRecordForm } from '@/components/forms/HealthRecordForm';
import { FeedingScheduleModal } from '@/components/FeedingScheduleModal';
import { TURKCE_LABELS, HEALTH_RECORD_COLORS, HEALTH_RECORD_ICONS, LAYOUT } from '@/constants';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import type { HealthRecord, FeedingSchedule } from '@/lib/types';
import MoneyDisplay from '@/components/ui/MoneyDisplay';


type CareTabValue = 'health' | 'feeding';

export default function CareScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { settings } = useUserSettingsStore();
  const baseCurrency = settings?.baseCurrency || 'TRY';
  const [activeTab, setActiveTab] = useState<CareTabValue>('health');
  
  // Health state
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();
  const [isHealthFormVisible, setIsHealthFormVisible] = useState(false);
  const [healthFormKey, setHealthFormKey] = useState(0);
  
  // Feeding state
  const [isFeedingModalVisible, setIsFeedingModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<FeedingSchedule | undefined>();

  // Get pets for selection
  const { data: pets = [], isLoading: petsLoading } = usePets();

  const petNameById = useMemo(() => {
    return pets.reduce<Record<string, string>>((acc, pet) => {
      acc[pet._id] = pet.name;
      return acc;
    }, {});
  }, [pets]);

  // Health data
  const {
    data: healthRecords = [],
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth
  } = useHealthRecords(selectedPetId);

  // Feeding data
  const { data: feedingSchedulesAll = [], isLoading: feedingLoading } = useAllFeedingSchedules();
  
  // Mutations
  const deleteScheduleMutation = useDeleteFeedingSchedule();
  const toggleScheduleMutation = useToggleFeedingSchedule();

  // Filter health records by type (all records since we removed type filter)
  const filteredHealthRecords = healthRecords;

  // Filter feeding schedules by selected pet
  const feedingSchedules = selectedPetId
    ? feedingSchedulesAll.filter((schedule) => schedule.petId === selectedPetId)
    : feedingSchedulesAll;

  // Health handlers
  const handleAddHealthRecord = () => {
    setHealthFormKey((current) => current + 1);
    setIsHealthFormVisible(true);
  };

  const handleHealthFormSuccess = () => {
    setIsHealthFormVisible(false);
    refetchHealth();
  };

  const handleHealthFormCancel = () => {
    setIsHealthFormVisible(false);
  };


  // Feeding handlers
  const handleAddSchedule = () => {
    setSelectedSchedule(undefined);
    setIsFeedingModalVisible(true);
  };

  const handleSchedulePress = (schedule: FeedingSchedule) => {
    setSelectedSchedule(schedule);
    setIsFeedingModalVisible(true);
  };

  const handleEditSchedule = (schedule: FeedingSchedule) => {
    setSelectedSchedule(schedule);
    setIsFeedingModalVisible(true);
  };

  const handleDeleteSchedule = async (schedule: FeedingSchedule) => {
    try {
      await deleteScheduleMutation.mutateAsync(schedule._id);
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleToggleActive = async (schedule: FeedingSchedule, isActive: boolean) => {
    try {
      await toggleScheduleMutation.mutateAsync({ id: schedule._id, isActive });
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleFeedingModalClose = () => {
    setIsFeedingModalVisible(false);
    setSelectedSchedule(undefined);
  };

  const renderHealthContent = () => {
    if (petsLoading) {
      return <LoadingSpinner />;
    }

    if (pets.length === 0) {
      return (
        <EmptyState
          title={t('health.noPets')}
          description={t('health.addPetFirstToViewRecords')}
          icon="dog"
        />
      );
    }

    // Don't require pet selection - show all records when no pet is selected

    if (healthLoading) {
      return <LoadingSpinner />;
    }

    if (healthError) {
      return (
        <EmptyState
          title={t('common.error')}
          description={t('health.loadingError')}
          icon="alert-circle"
          buttonText={t('common.retry')}
          onButtonPress={() => refetchHealth()}
        />
      );
    }

    if (filteredHealthRecords.length === 0) {
      return (
        <EmptyState
          title={t('health.noRecordsShort')}
          description={t('health.noRecordsMessage')}
          icon="medical-bag"
          buttonText={t('health.addFirstRecord')}
          onButtonPress={handleAddHealthRecord}
        />
      );
    }

    return (
      <View style={styles.listContainer}>
        {filteredHealthRecords.map((record: HealthRecord) => (
          <Pressable
            key={record._id}
            onPress={() => router.push(`/health/${record._id}`)}
            style={({ pressed }) => [
              styles.healthCard,
              {
                backgroundColor: theme.colors.surface,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.healthAccent,
                {
                  backgroundColor:
                    HEALTH_RECORD_COLORS[record.type as keyof typeof HEALTH_RECORD_COLORS] ||
                    theme.colors.outline,
                },
              ]}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.healthContent, { flex: 1 }]}>
                <View style={styles.healthHeader}>
                  <View style={styles.healthTitleRow}>
                    <View
                      style={[
                        styles.healthIconWrapper,
                        {
                          backgroundColor: `${
                            HEALTH_RECORD_COLORS[
                              record.type as keyof typeof HEALTH_RECORD_COLORS
                            ] || theme.colors.outline
                          }1A`,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          HEALTH_RECORD_ICONS[
                            record.type as keyof typeof HEALTH_RECORD_ICONS
                          ] || 'medical-bag'
                        }
                        size={18}
                        color={
                          HEALTH_RECORD_COLORS[
                            record.type as keyof typeof HEALTH_RECORD_COLORS
                          ] || theme.colors.outline
                        }
                      />
                    </View>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
                      {record.title}
                    </Text>
                  </View>
                </View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {TURKCE_LABELS.HEALTH_RECORD_TYPES[record.type as keyof typeof TURKCE_LABELS.HEALTH_RECORD_TYPES]}
                </Text>
                <View style={[styles.healthDatePill, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <MaterialCommunityIcons
                    name="calendar-blank"
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {new Date(record.date).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                {record.veterinarian && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Dr. {record.veterinarian}
                  </Text>
                )}
                {record.cost !== undefined && record.cost !== null && (
                  <MoneyDisplay
                    amount={record.cost}
                    currency={(record as { currency?: string }).currency}
                    baseCurrency={baseCurrency}
                    amountBase={(record as { amountBase?: number }).amountBase}
                    size="small"
                  />
                )}
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.colors.onSurfaceVariant}
                style={{ marginLeft: 8 }}
              />
            </View>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderFeedingContent = () => {
    if (petsLoading || feedingLoading) {
      return <LoadingSpinner />;
    }

    if (feedingSchedules.length === 0) {
      return (
        <EmptyState
          title={t('feedingSchedule.noSchedules')}
          description={t('feedingSchedule.addFirstSchedule')}
          icon="food"
        />
      );
    }

    return (
      <View style={styles.listContainer}>
        {feedingSchedules.map((schedule) => (
          <FeedingScheduleCard
            key={schedule._id}
            schedule={schedule}
            onPress={handleSchedulePress}
            onEdit={handleEditSchedule}
            onDelete={handleDeleteSchedule}
            onToggleActive={handleToggleActive}
            showPetInfo={true}
            showActions
            petName={petNameById[schedule.petId]}
          />
        ))}
      </View>
    );
  };

  return (
    <ProtectedRoute featureName={t('subscription.features.healthRecords')}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>

        <View style={styles.segmentedContainer}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as CareTabValue)}
            buttons={[
              { 
                value: 'health', 
                label: t('care.health'),
                icon: 'heart-pulse'
              },
              { 
                value: 'feeding', 
                label: t('care.feeding'),
                icon: 'food'
              }
            ]}
            density="small"
            style={StyleSheet.flatten([
              styles.segmentedButtons,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceVariant },
            ])}
          />
        </View>

        {/* Pet selector */}
        {!petsLoading && pets.length > 0 && (
          <View style={styles.petSelector}>
            <PetPickerBase
              pets={pets}
              selectedPetId={selectedPetId}
              onSelect={(petId) => setSelectedPetId(petId)}
              onSelectAll={() => setSelectedPetId(undefined)}
              showAllOption
              label={t('health.selectPet')}
              allLabel={t('common.all')}
            />
          </View>
        )}


        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'health' && renderHealthContent()}
          {activeTab === 'feeding' && renderFeedingContent()}
        </ScrollView>

        {/* FABs */}
        {activeTab === 'health' && (
          <FAB
            icon="add"
            style={{ ...styles.fab, backgroundColor: theme.colors.secondary }}
            onPress={handleAddHealthRecord}
          />
        )}

        {activeTab === 'feeding' && (
          <FAB
            icon="add"
            style={{ ...styles.fab, backgroundColor: theme.colors.primary }}
            onPress={handleAddSchedule}
          />
        )}

        {/* Modals */}
        <HealthRecordForm
          key={healthFormKey}
          visible={isHealthFormVisible}
          onSuccess={handleHealthFormSuccess}
          onCancel={handleHealthFormCancel}
        />

        <FeedingScheduleModal
          visible={isFeedingModalVisible}
          schedule={selectedSchedule}
          initialPetId={selectedPetId || undefined}
          onClose={handleFeedingModalClose}
          onSuccess={() => {}}
          pets={pets}
        />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  segmentedContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  segmentedButtons: {
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  petSelector: {
    padding: 16,
    paddingTop: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: LAYOUT.TAB_BAR_HEIGHT,
  },
  healthCard: {
    borderRadius: 20,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  healthAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  healthContent: {
    gap: 6,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  healthIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
