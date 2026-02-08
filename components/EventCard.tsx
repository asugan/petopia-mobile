import { Chip, IconButton, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { formatEventDate, formatTime, getRelativeTime } from '@/lib/utils/date';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, GestureResponderEvent } from 'react-native';
import { getEventTypeIcon, getEventTypeLabel } from '../constants/eventIcons';
import { getEventColor } from '@/lib/utils/eventColors';
import { Event } from '../lib/types';
import { FEATURE_ROUTES } from '@/constants/routes';

interface EventCardProps {
  event: Event;
  onPress?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  showPetInfo?: boolean;
  showActions?: boolean;
  compact?: boolean;
  testID?: string;
}

export function EventCard({
  event,
  onPress,
  onEdit,
  onDelete,
  showPetInfo = true,
  showActions = true,
  compact = false,
  testID,
}: EventCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();

  // Format event date and time
  const getFormattedEventDateTime = () => {
    return formatEventDate(event.startTime, t);
  };

  const getFormattedEventTime = () => {
    return formatTime(event.startTime);
  };

  const getEventRelativeTime = () => {
    return getRelativeTime(event.startTime);
  };

  const eventTypeColor = getEventColor(event.type, theme);
  const eventTypeIcon = getEventTypeIcon(event.type);
  const eventTypeLabel = getEventTypeLabel(event.type, t);

  const handlePress = React.useCallback(() => {
    // If custom onPress is provided, use it; otherwise navigate to detail page
    if (onPress) {
      onPress(event);
    } else {
      router.push(FEATURE_ROUTES.petEvent(event._id));
    }
  }, [onPress, event, router]);

  const handleEdit = React.useCallback((e: GestureResponderEvent) => {
    e.stopPropagation();
    onEdit?.(event);
  }, [onEdit, event]);

  const handleDelete = React.useCallback((e: GestureResponderEvent) => {
    e.stopPropagation();
    onDelete?.(event);
  }, [onDelete, event]);

  const cardStyle = compact ? styles.compactCard : styles.card;
  const contentStyle = compact ? styles.compactContent : styles.content;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        cardStyle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: eventTypeColor,
          borderWidth: 2,
        }
      ]}
      testID={testID}
    >
      <View style={contentStyle}>
        {/* Header with event type and time */}
        <View style={styles.header}>
          <View style={styles.eventTypeContainer}>
            <View
              style={[
                styles.eventTypeIcon,
                { backgroundColor: eventTypeColor }
              ]}
            >
              <Text style={styles.eventTypeIconText}>
                {eventTypeIcon}
              </Text>
            </View>
            <View style={styles.eventTypeInfo}>
              <Text
                variant="labelMedium"
                style={[styles.eventTypeLabel, { color: eventTypeColor }]}
              >
                {eventTypeLabel}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.relativeTime, { color: theme.colors.onSurfaceVariant }]}
              >
                {getEventRelativeTime()}
              </Text>
            </View>
          </View>

          <View style={styles.timeContainer}>
            <Text
              variant="labelMedium"
              style={[styles.dateTime, { color: theme.colors.onSurface }]}
            >
              {getFormattedEventDateTime()}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.time, { color: theme.colors.onSurface }]}
            >
              {getFormattedEventTime()}
            </Text>
          </View>
        </View>

        {/* Event Title */}
        <Text
          variant="titleMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
          numberOfLines={compact ? 1 : 2}
        >
          {event.title}
        </Text>

        {/* Pet Information */}
        {showPetInfo && (
          <View style={styles.petInfo}>
            <Chip
              mode="flat"
              textStyle={[
                styles.petChipText,
                { color: theme.colors.onSurfaceVariant }
              ]}
              style={[
                styles.petChip,
                { backgroundColor: theme.colors.surfaceVariant }
              ]}
            >
              🐾 {t('eventCard.forPet')}
            </Chip>
          </View>
        )}

        {/* Footer with reminder and actions */}
        <View style={styles.footer}>
          <View style={styles.indicatorsContainer}>
            {/* Recurring indicator */}
            {event.recurrenceRuleId && (
              <View style={styles.indicatorContainer}>
                <Text style={styles.indicatorIcon}>🔄</Text>
                <Text
                  variant="labelSmall"
                  style={[styles.indicatorText, { color: theme.colors.primary, fontWeight: '700' }]}
                >
                  {t('eventCard.recurring')}
                </Text>
              </View>
            )}

            {/* Reminder indicator */}
            {event.reminder && (
              <View style={styles.indicatorContainer}>
                <Text style={styles.indicatorIcon}>🔔</Text>
                <Text
                  variant="labelSmall"
                  style={[styles.indicatorText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {t('eventCard.reminderSet')}
                </Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          {showActions && (
            <View style={styles.actions}>
              {onEdit && (
                <IconButton
                  icon="pencil"
                  size={20}
                  iconColor={theme.colors.primary}
                  onPress={handleEdit}
                  testID={`${testID}-edit`}
                />
              )}
              {onDelete && (
                <IconButton
                  icon="delete"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={handleDelete}
                  testID={`${testID}-delete`}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  compactCard: {
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  content: {
    padding: 16,
  },
  compactContent: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  eventTypeIconText: {
    fontSize: 16,
  },
  eventTypeInfo: {
    flex: 1,
  },
  eventTypeLabel: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  relativeTime: {
    fontSize: 11,
    marginTop: 1,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  dateTime: {
    fontWeight: '500',
  },
  time: {
    fontWeight: '400',
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    lineHeight: 20,
    marginBottom: 8,
  },
  petInfo: {
    marginBottom: 8,
  },
  petChip: {
    height: 28,
    alignSelf: 'flex-start',
  },
  petChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
  },
});

export default EventCard;
