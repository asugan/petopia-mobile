import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, FAB } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { EventModal } from '@/components/EventModal';
import { useUpcomingEvents, useCalendarEvents, useEvent } from '@/lib/hooks/useEvents';
import { Event } from '@/lib/types';
import { LAYOUT } from '@/constants';
import { ProtectedRoute } from '@/components/subscription';
import { CalendarEventCard } from '@/components/calendar/CalendarEventCard';

type CalendarViewType = 'month' | 'week';

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { petId, action, editEventId } = useLocalSearchParams<{ petId?: string; action?: string; editEventId?: string }>();

  const [viewType, setViewType] = useState<CalendarViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [initialPetId, setInitialPetId] = useState<string | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);

  const { data: eventToEdit } = useEvent(editEventId);

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
  const formattedDate = currentDate ? currentDate.toISOString().substring(0, 10) : '';
  const {
    data: selectedDateEvents = [],
    isLoading: isLoadingSelected,
    error: errorSelected,
  } = useCalendarEvents(formattedDate);

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

  const handleAddEvent = () => {
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
    <ProtectedRoute featureName={t('subscription.features.calendar')}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.calendarContainer}>
          {renderCalendarView()}
          <View
            style={[
              styles.eventsWrapper,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <FlatList
              data={selectedDateEvents}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <CalendarEventCard
                  event={item}
                  onPress={handleEventPress}
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
                  <View style={styles.errorContainer}>
                    <Text
                      variant="bodyLarge"
                      style={[styles.errorText, { color: theme.colors.error }]}
                    >
                      {t('errors.loadingFailed')}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={[styles.errorMessage, { color: theme.colors.onSurfaceVariant }]}
                    >
                      {errorSelected.message}
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
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
