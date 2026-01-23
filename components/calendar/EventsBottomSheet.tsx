import React, { useCallback, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { Event } from '@/lib/types';
import { CalendarEventCard } from './CalendarEventCard';
import { BOTTOM_SHEET, LAYOUT } from '@/constants';

export interface EventsBottomSheetRef {
  snapToIndex: (index: number) => void;
}

interface EventsBottomSheetProps {
  events: Event[];
  isLoading: boolean;
  selectedDate: Date;
  onEventPress: (event: Event) => void;
  onToggleReminder: (event: Event, value: boolean) => void;
  onSnapChange?: (index: number) => void;
  testID?: string;
}

export const EventsBottomSheet = forwardRef<EventsBottomSheetRef, EventsBottomSheetProps>(
  function EventsBottomSheet(
    {
      events,
      isLoading,
      selectedDate,
      onEventPress,
      onToggleReminder,
      onSnapChange,
      testID,
    },
    ref
  ) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const locale = i18n.language === 'tr' ? tr : enUS;

  const snapPoints = useMemo(() => [...BOTTOM_SHEET.SNAP_POINTS], []);

  useImperativeHandle(ref, () => ({
    snapToIndex: (index: number) => {
      bottomSheetRef.current?.snapToIndex(index);
    },
  }));

  const handleSheetChange = useCallback(
    (index: number) => {
      onSnapChange?.(index);
    },
    [onSnapChange]
  );

  const renderItem = useCallback(
    ({ item }: { item: Event }) => (
      <CalendarEventCard
        event={item}
        onPress={onEventPress}
        onToggleReminder={onToggleReminder}
        testID={testID ? `${testID}-event-${item._id}` : undefined}
      />
    ),
    [onEventPress, onToggleReminder, testID]
  );

  const keyExtractor = useCallback((item: Event) => item._id, []);

  const formattedDate = format(selectedDate, 'EEEE, d MMMM', { locale });

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        <Text
          variant="titleMedium"
          style={[styles.dateTitle, { color: theme.colors.onSurface }]}
        >
          {formattedDate}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.eventCount, { color: theme.colors.onSurfaceVariant }]}
        >
          {events.length > 0
            ? t('calendar.eventCount', { count: events.length })
            : t('calendar.noEvents')}
        </Text>
      </View>
    ),
    [formattedDate, events.length, theme.colors, t]
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text
            variant="bodyMedium"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('common.loading')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text
          variant="bodyMedium"
          style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('calendar.noEvents')}
        </Text>
      </View>
    );
  }, [isLoading, theme.colors, t]);

  const renderHandle = useCallback(
    () => (
      <View
        style={[
          styles.handleContainer,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <View
          style={[
            styles.handleIndicator,
            { backgroundColor: theme.colors.onSurfaceVariant },
          ]}
        />
      </View>
    ),
    [theme.colors]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={BOTTOM_SHEET.DEFAULT_INDEX}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      handleComponent={renderHandle}
      backgroundStyle={[
        styles.background,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
      enablePanDownToClose={false}
      enableDynamicSizing={false}
    >
      <View
        style={[styles.content, { backgroundColor: theme.colors.surfaceVariant }]}
        testID={testID}
      >
        <BottomSheetFlatList
          data={events}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  content: {
    flex: 1,
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateTitle: {
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  eventCount: {
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: LAYOUT.FAB_OFFSET + 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
  },
});

export default EventsBottomSheet;
