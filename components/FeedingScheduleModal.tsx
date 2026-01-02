import React from 'react';
import { View, StyleSheet, Modal as RNModal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, Snackbar, Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { FeedingSchedule, Pet } from '../lib/types';
import { FeedingScheduleForm } from './forms/FeedingScheduleForm';
import { type FeedingScheduleFormData, transformFormDataToAPI } from '../lib/schemas/feedingScheduleSchema';
import {
  useCreateFeedingSchedule,
  useUpdateFeedingSchedule,
} from '../lib/hooks/useFeedingSchedules';

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
  const [loading, setLoading] = React.useState(false);
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  // React Query hooks for server state
  const createMutation = useCreateFeedingSchedule();
  const updateMutation = useUpdateFeedingSchedule();

  const showSnackbar = React.useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const handleSubmit = React.useCallback(async (data: FeedingScheduleFormData) => {
    setLoading(true);
    try {
      const apiData = transformFormDataToAPI(data);
      if (schedule) {
        // Update existing schedule
        await updateMutation.mutateAsync({
          _id: schedule._id,
          data: apiData,
        });
        showSnackbar(t('feedingSchedule.updateSuccess') || 'Besleme programı başarıyla güncellendi');
      } else {
        // Create new schedule
        await createMutation.mutateAsync(apiData);
        showSnackbar(t('feedingSchedule.createSuccess') || 'Besleme programı başarıyla eklendi');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('feedingSchedule.errors.submitFailed') || 'İşlem başarısız oldu';
      showSnackbar(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [schedule, createMutation, updateMutation, onSuccess, onClose, showSnackbar, t]);

  const handleClose = React.useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [onClose, loading]);

  const handleSnackbarDismiss = React.useCallback(() => {
    setSnackbarVisible(false);
  }, []);

  return (
    <>
      <RNModal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
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
              {t('common.close') || 'Kapat'}
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

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={handleSnackbarDismiss}
          duration={3000}
          message={snackbarMessage}
          style={{
            ...styles.snackbar,
            backgroundColor: snackbarMessage.includes('başarıyla') ? theme.colors.primary : theme.colors.error
          }}
        />
      </Portal>
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
  snackbar: {
    marginBottom: 16,
  },
});

export default FeedingScheduleModal;
