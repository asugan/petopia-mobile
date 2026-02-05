import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Switch } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

import { tr, enUS } from 'date-fns/locale';
import { Event } from '@/lib/types';
import { getEventColor } from '@/lib/utils/eventColors';
import { getEventTypeIcon, getEventTypeLabel } from '@/constants/eventIcons';
import { useUserTimezone } from '@/lib/hooks/useUserTimezone';
import { formatInTimeZone } from '@/lib/utils/date';

interface CalendarEventCardProps {
  event: Event;
  onPress?: (event: Event) => void;
  onToggleReminder?: (event: Event, value: boolean) => void;
  testID?: string;
}

export function CalendarEventCard({
  event,
  onPress,
  onToggleReminder,
  testID,
}: CalendarEventCardProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'tr' ? tr : enUS;
  const userTimezone = useUserTimezone();

  const eventColor = getEventColor(event.type, theme);
  const eventTypeLabel = getEventTypeLabel(event.type, t);
  const eventTypeText = eventTypeLabel.toLocaleUpperCase(i18n.language);
  const eventTypeIcon = getEventTypeIcon(event.type);
  const subtitle = event.location || event.description;
  const reminderLabel = event.reminder
    ? t('calendar.reminderOn')
    : t('calendar.reminderOff');
  const statusColorMap = {
    upcoming: theme.colors.primary,
    completed: theme.colors.success,
    cancelled: theme.colors.error,
    missed: theme.colors.warning,
  } as const;
  const statusLabelMap = {
    upcoming: t('events.statusUpcoming'),
    completed: t('events.statusCompleted'),
    cancelled: t('events.statusCancelled'),
    missed: t('events.statusMissed'),
  } as const;
  const statusColor = statusColorMap[event.status] ?? theme.colors.onSurfaceVariant;
  const statusLabel = statusLabelMap[event.status] ?? event.status;

  const handlePress = React.useCallback(() => {
    onPress?.(event);
  }, [event, onPress]);

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.onSurface,
        },
      ]}
      onPress={handlePress}
      testID={testID}
    >
      <View style={[styles.accent, { backgroundColor: eventColor }]} />
      <View style={styles.content}>
        <View style={styles.leftColumn}>
          <View
            style={[
              styles.iconBubble,
              { backgroundColor: eventColor },
            ]}
          >
            <MaterialCommunityIcons
              name={eventTypeIcon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={18}
              color={theme.colors.onSurface}
            />
          </View>
          <View
            style={[
              styles.typePill,
              { backgroundColor: eventColor },
            ]}
          >
            <Text
              variant="labelSmall"
              style={[styles.typeText, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {eventTypeText}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <Text
            variant="titleSmall"
            style={[styles.time, { color: theme.colors.onSurface }]}
          >
            {formatInTimeZone(event.startTime, userTimezone, 'p', { locale })}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.title, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {event.title}
          </Text>
          {subtitle && (
            <Text
              variant="bodySmall"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.avatarColumn}>
            <Switch
              value={event.reminder}
              onValueChange={(value) => onToggleReminder?.(event, value)}
              color={eventColor}
              testID={testID ? `${testID}-reminder-toggle` : undefined}
            />
          </View>
          <View style={styles.statusGroup}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: event.reminder
                      ? theme.colors.secondary
                      : theme.colors.surfaceDisabled,
                  },
                ]}
              />
              <Text
                variant="labelSmall"
                style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}
              >
                {reminderLabel}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor },
                ]}
              />
              <Text
                variant="labelSmall"
                style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 22,
  },
  leftColumn: {
    alignItems: 'center',
    width: 72,
    marginRight: 14,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  details: {
    flex: 1,
    alignItems: 'flex-start',
  },
  time: {
    fontWeight: '700',
    marginBottom: 2,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 2,
  },
  rightColumn: {
    marginLeft: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  avatarColumn: {
    width: 52,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusGroup: {
    marginTop: 8,
    alignItems: 'flex-end',
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  chevronContainer: {
    marginLeft: 8,
  },
});

export default CalendarEventCard;
