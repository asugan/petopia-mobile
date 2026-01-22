import React from 'react';
import { View, StyleSheet, Modal as RNModal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { FeedingSchedule, Pet } from '../lib/types';
import { FeedingScheduleForm } from './forms/FeedingScheduleForm';
import { type FeedingScheduleFormData, transformFormDataToAPI } from '../lib/schemas/feedingScheduleSchema';
import {
  useCreateFeedingSchedule,
  useUpdateFeedingSchedule,
  useAllFeedingSchedules,
} from '../lib/hooks/useFeedingSchedules';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { showToast } from '@/lib/toast/showToast';

interface FeedingScheduleModalProps {
  visible: boolean;
  schedule?: FeedingSchedule;
  initialPetId?: string;
  onClose: () => void;
  onSuccess: () => void;
  pets?: Pet[];
  testID?: string;
}

export function FeedingScheduleModal({
  visible,
  schedule,
  initialPetId,
  onClose,
  onSuccess,
  pets = [],
  testID,
}: FeedingScheduleModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const { isProUser } = useSubscription();
  const { data: feedingSchedulesAll = [] } = useAllFeedingSchedules();
  const activeFeedingSchedules = feedingSchedulesAll.filter((schedule) => schedule.isActive);

  // React Query hooks for server state
  const createMutation = useCreateFeedingSchedule();
  const updateMutation = useUpdateFeedingSchedule();


  const handleSubmit = React.useCallback(async (data: FeedingScheduleFormData) => {
    try {
      const apiData = transformFormDataToAPI(data);
      const willBeActive = apiData.isActive !== false;

      if (schedule) {
        // Update existing schedule
        if (willBeActive && !schedule.isActive && !isProUser && activeFeedingSchedules.length >= 1) {
          router.push('/subscription');
          return;
        }
      } else {
        // Create new schedule
        if (willBeActive && !isProUser && activeFeedingSchedules.length >= 1) {
          router.push('/subscription');
          return;
        }
      }

      setLoading(true);
      if (schedule) {
        await updateMutation.mutateAsync({
          _id: schedule._id,
          data: apiData,
        });
        showToast({ type: 'success', title: t('feedingSchedule.updateSuccess') });
      } else {
        await createMutation.mutateAsync(apiData);
        showToast({ type: 'success', title: t('feedingSchedule.createSuccess') });
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('feedingSchedule.errors.submitFailed');
      showToast({ type: 'error', title: t('feedingSchedule.errors.submitFailed'), message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [schedule, createMutation, updateMutation, onSuccess, onClose, t, activeFeedingSchedules.length, isProUser, router]);

  const handleClose = React.useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [onClose, loading]);

  const animationType = Platform.select({
    ios: 'slide' as const,
    android: 'fade' as const,
  });

  const presentationStyle = Platform.select({
    ios: 'pageSheet' as const,
    android: undefined,
  });

  return (
    <>
      <RNModal
        visible={visible}
        animationType={animationType}
        presentationStyle={presentationStyle}
        onDismiss={handleClose}
        onRequestClose={handleClose}
        testID={testID}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {schedule ? t('feedingSchedule.editTitle') : t('feedingSchedule.createTitle')}
            </Text>
            <Button
              mode="text"
              onPress={handleClose}
              disabled={loading}
              compact
            >
              {t('common.close')}
            </Button>
          </View>

          <FeedingScheduleForm
            schedule={schedule}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            initialPetId={initialPetId}
            pets={pets}
            testID="feeding-schedule-form-in-modal"
          />
        </SafeAreaView>
      </RNModal>

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default FeedingScheduleModal;
