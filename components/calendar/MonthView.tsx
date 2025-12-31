import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, IconButton } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Event } from '../../lib/types';
import { getEventColor } from '@/lib/utils/eventColors';
import { toISODateString } from '@/lib/utils/dateConversion';

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  selectedDate?: Date;
  onDayPress: (date: Date) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleView: () => void;
  testID?: string;
}

export function MonthView({
  currentDate,
  events,
  selectedDate,
  onDayPress,
  onPrevious,
  onNext,
  onToggleView,
  testID,
}: MonthViewProps) {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.language === 'tr' ? tr : enUS;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getEventsForDay = (day: Date) => {
    const dayStr = toISODateString(day);
    if (!dayStr) return [];

    return events.filter((event) => {
      const eventDateStr = toISODateString(new Date(event.startTime));
      return eventDateStr === dayStr;
    });
  };

  const weekDays = useMemo(() => {
    const days = [];
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      days.push(format(day, 'EEE', { locale }).toLocaleUpperCase(i18n.language));
    }
    return days;
  }, [i18n.language, locale]);

  const renderDay = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isTodayDate = isToday(day);
    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
    const hasEvents = dayEvents.length > 0;
    const dayNumber = format(day, 'd');

    const dotColor = hasEvents
      ? getEventColor(dayEvents[0].type, theme)
      : 'transparent';

    return (
      <Pressable
        key={day.toISOString()}
        style={styles.dayCell}
        onPress={() => onDayPress(day)}
        testID={`${testID}-day-${format(day, 'yyyy-MM-dd')}`}
      >
        <View
          style={[
            styles.dayContent,
            isSelected && { backgroundColor: theme.colors.primary },
            !isSelected && isTodayDate && {
              borderWidth: 1,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Text
            variant="bodyMedium"
            style={[
              styles.dayNumber,
              {
                color: isCurrentMonth
                  ? isSelected
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface
                  : theme.colors.onSurfaceVariant,
                opacity: isCurrentMonth ? 1 : 0.4,
                fontWeight: isSelected ? '700' : '500',
              },
            ]}
          >
            {dayNumber}
          </Text>
        </View>
        {isCurrentMonth && (
          <View
            style={[
              styles.eventDot,
              {
                backgroundColor: isSelected
                  ? theme.colors.onPrimary
                  : dotColor,
                opacity: hasEvents ? 1 : 0,
              },
            ]}
          />
        )}
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceVariant },
      ]}
      testID={testID}
    >
      <View style={styles.headerRow}>
        <IconButton
          icon="chevron-left"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={onPrevious}
          testID={`${testID}-previous`}
        />
        <Text
          variant="titleMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          {format(currentDate, 'MMMM yyyy', { locale })}
        </Text>
        <IconButton
          icon="chevron-right"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={onNext}
          testID={`${testID}-next`}
        />
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text
              variant="labelSmall"
              style={[
                styles.weekDayText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarDays.map((day) => renderDay(day))}
      </View>

      <View
        style={[
          styles.bottomIndicator,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      />
      <IconButton
        icon="fullscreen-exit"
        size={18}
        iconColor={theme.colors.onSurfaceVariant}
        onPress={onToggleView}
        style={styles.toggleButton}
        testID={`${testID}-toggle`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderRadius: 28,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontWeight: '600',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayContent: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 14,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
  },
  bottomIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '45%',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  toggleButton: {
    position: 'absolute',
    bottom: 2,
    right: 8,
  },
});

export default MonthView;
