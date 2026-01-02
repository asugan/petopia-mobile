import React from 'react';
import { View, StyleSheet, Modal as RNModal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, Snackbar, Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { Event } from '../lib/types';
import { EventFormData, transformFormDataToAPI } from '../lib/schemas/eventSchema';
import { EventForm } from './forms/EventForm';
import { useCreateEvent, useUpdateEvent } from '../lib/hooks/useEvents';
import { usePets } from '../lib/hooks/usePets';
import { ReminderPresetKey } from '@/constants/reminders';

interface EventModalProps {
  visible: boolean;
  event?: Event;
  initialPetId?: string;
  onClose: () => void;
  onSuccess: () => void;
  testID?: string;
}

export function EventModal({
  visible,
  event,
  initialPetId,
  onClose,
  onSuccess,
  testID,
}: EventModalProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  // React Query hooks for server state
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const { data: pets = [] } = usePets();

  const showSnackbar = React.useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const handleSubmit = React.useCallback(async (data: EventFormData) => {
    setLoading(true);
    try {
      // Transform form data to API format (combines date+time into ISO datetime)
      const apiData = transformFormDataToAPI(data);
      const reminderPresetKey: ReminderPresetKey = data.reminderPreset || 'standard';

      if (event) {
        // Event güncelleme
        await updateEventMutation.mutateAsync({
          _id: event._id,
          data: { ...apiData, reminderPresetKey }
        });
        showSnackbar('Etkinlik başarıyla güncellendi');
      } else {
        // Yeni event oluşturma
        await createEventMutation.mutateAsync({ ...apiData, reminderPresetKey });
        showSnackbar('Etkinlik başarıyla eklendi');
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'İşlem başarısız oldu';
      showSnackbar(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [event, createEventMutation, updateEventMutation, onSuccess, onClose, showSnackbar]);

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
              {event ? 'Etkinliği Düzenle' : 'Yeni Etkinlik Ekle'}
            </Text>
            <Button
              mode="text"
              onPress={handleClose}
              disabled={loading}
              compact
            >
              Kapat
            </Button>
          </View>

          <EventForm
            event={event}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            initialPetId={initialPetId}
            pets={pets}
            testID="event-form-in-modal"
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

export default EventModal;
