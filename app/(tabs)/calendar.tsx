import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { FAB } from '@/components/ui';
import { HeaderActions, LargeTitle } from '@/components/LargeTitle';
import { useTheme } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { MonthView } from '@/components/calendar/MonthView';
import { toISODateString } from '@/lib/utils/dateConversion';
import { WeekView } from '@/components/calendar/WeekView';
import { EventsBottomSheet } from '@/components/calendar/EventsBottomSheet';
import { EventModal } from '@/components/EventModal';
import { useUpcomingEvents, useCalendarEvents, useEvent, useUpdateEvent } from '@/lib/hooks/useEvents';
import { eventKeys } from '@/lib/hooks/queryKeys';
import { Event } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/lib/toast/showToast';

type CalendarViewType = 'month' | 'week';

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { petId, action, editEventId, editType } = useLocalSearchParams<{ petId?: string; action?: string; editEventId?: string; editType?: string }>();

  const [viewType, setViewType] = useState<CalendarViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [initialPetId, setInitialPetId] = useState<string | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);

  const { data: eventToEdit } = useEvent(editEventId);
  const updateEventMutation = useUpdateEvent();

  useEffect(() => {
    if (action === 'create') {
      setInitialPetId(petId);
      setSelectedEvent(undefined);
      setModalVisible(true);
    } else if (editEventId && eventToEdit) {
      setSelectedEvent(eventToEdit);
      setModalVisible(true);
    }
  }, [action, petId, editEventId, eventToEdit]);

  const { data: upcomingEvents = [] } = useUpcomingEvents();
  const formattedDate = toISODateString(currentDate) ?? '';
  const {
    data: selectedDateEvents = [],
    isLoading: isLoadingSelected,
    error: errorSelected,
  } = useCalendarEvents(formattedDate);

  useEffect(() => {
    if (errorSelected) {
      showToast({
        type: 'error',
        title: t('errors.loadingFailed'),
        message: errorSelected.message,
      });
    }
  }, [errorSelected, t]);

  const handlePrevious = () => {
    switch (viewType) {
      case 'month':
        setCurrentDate((prev) => subMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate((prev) => subWeeks(prev, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewType) {
      case 'month':
        setCurrentDate((prev) => addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate((prev) => addWeeks(prev, 1));
        break;
    }
  };

  const handleToggleView = () => {
    setViewType((prev) => (prev === 'month' ? 'week' : 'month'));
  };

  const handleDayPress = (date: Date) => {
    setCurrentDate(date);
  };

  const handleEventPress = useCallback((event: Event) => {
    router.push(`/event/${event._id}`);
  }, [router]);

  const handleToggleReminder = useCallback(async (event: Event, nextValue: boolean) => {
    const eventDate =
      toISODateString(new Date(event.startTime)) ??
      event.startTime.split('T')[0];

    queryClient.setQueryData<Event[]>(eventKeys.calendar(eventDate), (old) =>
      old?.map((item) =>
        item._id === event._id ? { ...item, reminder: nextValue } : item
      )
    );

    queryClient.setQueryData<Event[]>(eventKeys.list({ petId: 'all' }), (old) =>
      old?.map((item) =>
        item._id === event._id ? { ...item, reminder: nextValue } : item
      )
    );

    try {
      await updateEventMutation.mutateAsync({
        _id: event._id,
        data: {
          reminder: nextValue,
          reminderPreset: event.reminderPreset,
          startTime: event.startTime,
        },
      });
      queryClient.invalidateQueries({ queryKey: eventKeys.calendar(eventDate) });
      queryClient.invalidateQueries({ queryKey: eventKeys.list({ petId: 'all' }) });
    } catch {
      queryClient.invalidateQueries({ queryKey: eventKeys.calendar(eventDate) });
      queryClient.invalidateQueries({ queryKey: eventKeys.list({ petId: 'all' }) });
    }
  }, [queryClient, updateEventMutation]);

  const handleAddEvent = async () => {
    setInitialPetId(undefined);
    setSelectedEvent(undefined);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setInitialPetId(undefined);
    setSelectedEvent(undefined);
    if (editEventId) {
      router.setParams({ editEventId: undefined });
    }
  };

  const handleModalSuccess = () => {
    setModalVisible(false);
    setInitialPetId(undefined);
    setSelectedEvent(undefined);
    if (editEventId) {
      router.setParams({ editEventId: undefined });
    }
  };

  const renderCalendarView = () => {
    switch (viewType) {
      case 'month':
        return (
          <MonthView
            currentDate={currentDate}
            events={upcomingEvents}
            selectedDate={currentDate}
            onDayPress={handleDayPress}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToggleView={handleToggleView}
            testID="calendar-month-view"
          />
        );
      case 'week':
        return (
          <WeekView
            currentDate={currentDate}
            events={upcomingEvents}
            selectedDate={currentDate}
            onDayPress={handleDayPress}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToggleView={handleToggleView}
            testID="calendar-week-view"
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <LargeTitle title={t('calendar.calendar')} actions={<HeaderActions />} />
      </View>
      
      <View style={styles.calendarContainer}>
        {renderCalendarView()}
      </View>

      <EventsBottomSheet
        events={selectedDateEvents}
        isLoading={isLoadingSelected}
        selectedDate={currentDate}
        onEventPress={handleEventPress}
        onToggleReminder={handleToggleReminder}
        testID="calendar-events-bottom-sheet"
      />

      <FAB
        icon="add"
        style={{
          ...styles.fab,
          backgroundColor: theme.colors.primary,
          width: 56,
          height: 56,
          borderRadius: 28,
        }}
        onPress={handleAddEvent}
        testID="calendar-add-event-fab"
      />

      <EventModal
        visible={modalVisible}
        event={selectedEvent}
        editType={editType as 'single' | 'series'}
        initialPetId={initialPetId}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        testID="calendar-event-modal"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  calendarContainer: {
    paddingBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
