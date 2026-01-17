import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Text, FAB } from '@/components/ui';
import { HeaderActions, LargeTitle } from '@/components/LargeTitle';
import { useTheme } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { MonthView } from '@/components/calendar/MonthView';
import { toISODateString } from '@/lib/utils/dateConversion';
import { WeekView } from '@/components/calendar/WeekView';
import { EventModal } from '@/components/EventModal';
import { useUpcomingEvents, useCalendarEvents, useEvent, useAllEvents, useUpdateEvent } from '@/lib/hooks/useEvents';
import { eventKeys } from '@/lib/hooks/queryKeys';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { Event } from '@/lib/types';
import { LAYOUT } from '@/constants';
import { CalendarEventCard } from '@/components/calendar/CalendarEventCard';
import { useQueryClient } from '@tanstack/react-query';
import { showToast } from '@/lib/toast/showToast';

type CalendarViewType = 'month' | 'week';

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isProUser, presentPaywall } = useSubscription();
  const { petId, action, editEventId } = useLocalSearchParams<{ petId?: string; action?: string; editEventId?: string }>();

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
  const { data: allEvents = [] } = useAllEvents();
  const activeReminderCount = allEvents.filter((event) => event.reminder).length;
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

  const handleEventPress = (event: Event) => {
    router.push(`/event/${event._id}`);
  };

  const handleReminderLimitReached = () => {
    showToast({
      type: 'info',
      title: t('calendar.reminderLimitTitle'),
      message: t('calendar.reminderLimitMessage'),
    });
  };

  const handleToggleReminder = async (event: Event, nextValue: boolean) => {
    if (nextValue && !event.reminder && !isProUser && activeReminderCount >= 2) {
      handleReminderLimitReached();
      return;
    }

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
  };

  const handleAddEvent = async () => {
    if (!isProUser && activeReminderCount >= 2) {
      const didPurchase = await presentPaywall();
      if (!didPurchase) {
        return;
      }
    }
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

  const handleReminderLimitPress = async () => {
    await presentPaywall();
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
        <View
          style={[
            styles.eventsWrapper,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          {!isProUser && (
            <Pressable
              onPress={handleReminderLimitPress}
              style={({ pressed }) => [
                styles.reminderCounter,
                pressed && styles.chipPressed,
              ]}
            >
              <Text
                variant="labelSmall"
                style={{
                  color: activeReminderCount >= 2
                    ? theme.colors.error
                    : theme.colors.onSurfaceVariant,
                }}
              >
                {t('limits.calendar.counter', { used: activeReminderCount, limit: 2 })}
              </Text>
              {activeReminderCount >= 2 && (
                <Text variant="labelSmall" style={{ color: theme.colors.error }}>
                  {t('limits.calendar.cta')}
                </Text>
              )}
            </Pressable>
          )}
          <FlatList
            data={selectedDateEvents}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <CalendarEventCard
                event={item}
                onPress={handleEventPress}
                onToggleReminder={handleToggleReminder}
                testID={`calendar-event-${item._id}`}
              />
            )}
            contentContainerStyle={styles.eventsContent}
            ListEmptyComponent={
              isLoadingSelected ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text
                    variant="bodyMedium"
                    style={[styles.loadingText, { color: theme.colors.onSurface }]}
                  >
                    {t('common.loading')}
                  </Text>
                </View>
              ) : errorSelected ? (
                <View style={styles.emptyContainer}>
                  <Text
                    variant="bodyMedium"
                    style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {t('calendar.noEvents')}
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text
                    variant="bodyMedium"
                    style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {t('calendar.noEvents')}
                  </Text>
                </View>
              )
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

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
    flex: 1,
  },
  eventsWrapper: {
    flex: 1,
    marginTop: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
  },
  eventsContent: {
    paddingHorizontal: 16,
    paddingBottom: LAYOUT.FAB_OFFSET + 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
  reminderCounter: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 8,
    marginRight: 16,
  },
  chipPressed: {
    transform: [{ scale: 0.98 }],
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
