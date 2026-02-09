import React from 'react';
import { View, StyleSheet, Modal as RNModal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { Event } from '../lib/types';
import { EventFormData, transformFormDataToAPI, transformFormDataToRecurrenceRule } from '../lib/schemas/eventSchema';
import { EventForm } from './forms/EventForm';
import { useCreateEvent, useUpdateEvent } from '../lib/hooks/useEvents';
import { useCreateRecurrenceRule, useUpdateRecurrenceRule } from '../lib/hooks/useRecurrence';
import { usePets } from '../lib/hooks/usePets';
import { useUserTimezone } from '@/lib/hooks/useUserTimezone';
import { ReminderPresetKey } from '@/constants/reminders';
import { showToast } from '@/lib/toast/showToast';

interface EventModalProps {
  visible: boolean;
  event?: Event;
  editType?: 'single' | 'series';
  initialPetId?: string;
  onClose: () => void;
  onSuccess: () => void;
  testID?: string;
}

export function EventModal({
  visible,
  event,
  editType,
  initialPetId,
  onClose,
  onSuccess,
  testID,
}: EventModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = React.useState(false);

  // React Query hooks for server state
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const createRecurrenceRuleMutation = useCreateRecurrenceRule();
  const updateRecurrenceRuleMutation = useUpdateRecurrenceRule();
  const { data: pets = [] } = usePets();
  const userTimezone = useUserTimezone();


  const handleSubmit = React.useCallback(async (data: EventFormData) => {
    try {
      const reminderPresetKey: ReminderPresetKey = data.reminderPreset || 'standard';
      const reminderEnabled = data.reminder === true;

      setLoading(true);

      // Check if this is a recurring event
      if (data.isRecurring && data.recurrence && !event) {
        // Create a recurrence rule instead of a single event
        const ruleData = transformFormDataToRecurrenceRule(data, reminderEnabled, reminderPresetKey);
        await createRecurrenceRuleMutation.mutateAsync(ruleData);
        showToast({ type: 'success', title: t('serviceResponse.recurrence.createSuccess') });
      } else if (event) {
        // Event güncelleme
        if (editType === 'series' && event.recurrenceRuleId) {
          // Edit the whole recurrence rule
          const ruleData = transformFormDataToRecurrenceRule(data, reminderEnabled, reminderPresetKey);
          await updateRecurrenceRuleMutation.mutateAsync({
            id: event.recurrenceRuleId,
            data: ruleData
          });
          showToast({ type: 'success', title: t('serviceResponse.recurrence.updateSuccess') });
        } else {
          // Edit single event (normal behavior or editType === 'single')
          const apiData = transformFormDataToAPI(data, userTimezone);
          await updateEventMutation.mutateAsync({
            _id: event._id,
            data: { ...apiData, reminderPresetKey, reminder: reminderEnabled }
          });
          showToast({ type: 'success', title: t('serviceResponse.event.updateSuccess') });
        }
      } else {
        // Yeni tek seferlik event oluşturma
        const apiData = transformFormDataToAPI(data, userTimezone);
        await createEventMutation.mutateAsync({
          ...apiData,
          reminderPresetKey,
          reminder: reminderEnabled,
        });
        showToast({ type: 'success', title: t('serviceResponse.event.createSuccess') });
      }

      onSuccess();
      onClose();
    } catch (error) {
      const fallbackMessage = event 
        ? t('serviceResponse.event.updateError') 
        : data.isRecurring 
          ? t('serviceResponse.recurrence.createError') 
          : t('serviceResponse.event.createError');
      const errorMessage = error instanceof Error ? error.message : fallbackMessage;
      showToast({ type: 'error', title: fallbackMessage, message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [event, editType, createEventMutation, updateEventMutation, createRecurrenceRuleMutation, updateRecurrenceRuleMutation, onSuccess, onClose, t, userTimezone]);

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
              {event ? t('events.editTitle') : t('events.createTitle')}
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

          <EventForm
            event={event}
            editType={editType}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            initialPetId={initialPetId}
            pets={pets}
            testID="event-form-in-modal"
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

export default EventModal;
