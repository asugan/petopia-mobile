import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, IconButton } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { Event } from "../../lib/types";
import { getEventColor } from "@/lib/utils/eventColors";
import { useUserTimezone } from "@/lib/hooks/useUserTimezone";
import { isSameLocalDate, toLocalDateKey } from "@/lib/utils/timezoneDate";

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  selectedDate?: Date;
  onDayPress: (date: Date) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleView: () => void;
  testID?: string;
}

export function WeekView({
  currentDate,
  events,
  selectedDate,
  onDayPress,
  onPrevious,
  onNext,
  onToggleView,
  testID,
}: WeekViewProps) {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.language === "tr" ? tr : enUS;
  const userTimezone = useUserTimezone();

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const getEventsForDay = (day: Date) => {
    const dayKey = toLocalDateKey(day, userTimezone);
    if (!dayKey) return [];

    return events.filter((event) => {
      const eventDayKey = toLocalDateKey(event.startTime, userTimezone);
      return eventDayKey === dayKey;
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.surfaceVariant,
        },
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
          {format(currentDate, "MMMM yyyy", { locale })}
        </Text>
        <IconButton
          icon="chevron-right"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={onNext}
          testID={`${testID}-next`}
        />
        <IconButton
          icon="fullscreen"
          size={18}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={onToggleView}
          testID={`${testID}-toggle`}
        />
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((day) => {
          const isSelected = selectedDate
            ? isSameLocalDate(day, selectedDate, userTimezone)
            : false;
          const dayEvents = getEventsForDay(day);
          const hasEvents = dayEvents.length > 0;
          const dotColor = hasEvents
            ? getEventColor(dayEvents[0].type, theme)
            : theme.colors.primary;

          const dayKey = toLocalDateKey(day, userTimezone) || format(day, "yyyy-MM-dd");

          return (
            <Pressable
              key={day.toISOString()}
              style={styles.dayCell}
              onPress={() => onDayPress(day)}
              testID={`${testID}-day-${dayKey}`}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.weekDayLabel,
                  {
                    color: isSelected
                      ? theme.colors.onSurface
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {format(day, "EEE", { locale }).toLocaleUpperCase(
                  i18n.language,
                )}
              </Text>
              {isSelected ? (
                <View
                  style={[
                    styles.selectedDay,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.onPrimary, fontWeight: "700" }}
                  >
                    {format(day, "d")}
                  </Text>
                </View>
              ) : (
                <Text
                  variant="titleSmall"
                  style={[styles.dayNumber, { color: theme.colors.onSurface }]}
                >
                  {format(day, "d")}
                </Text>
              )}
              <View
                style={[
                  styles.eventDot,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.onSurface
                      : dotColor,
                    opacity: isSelected || hasEvents ? 1 : 0,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.bottomIndicator,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
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
    marginTop: 0,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontWeight: "700",
    textTransform: "capitalize",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekDayLabel: {
    fontWeight: "600",
    fontSize: 12,
    marginBottom: 6,
  },
  dayNumber: {
    fontWeight: "600",
    marginBottom: 6,
  },
  selectedDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  bottomIndicator: {
    position: "absolute",
    bottom: 8,
    left: "45%",
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});

export default WeekView;
