import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Event } from '@/lib/types';
import { getEventColor } from '@/lib/utils/eventColors';
import { getEventTypeIcon, getEventTypeLabel } from '@/constants/eventIcons';

interface CalendarEventCardProps {
  event: Event;
  onPress?: (event: Event) => void;
  testID?: string;
}

export function CalendarEventCard({
  event,
  onPress,
  testID,
}: CalendarEventCardProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'tr' ? tr : enUS;

  const eventColor = getEventColor(event.type, theme);
  const eventTypeLabel = getEventTypeLabel(event.type, t);
  const eventTypeText = eventTypeLabel.toLocaleUpperCase(i18n.language);
  const eventTypeIcon = getEventTypeIcon(event.type);
  const subtitle = event.location || event.description;

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
            {format(new Date(event.startTime), 'p', { locale })}
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

        <View style={styles.avatarColumn}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.surface,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="paw"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
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
  avatarColumn: {
    width: 52,
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  chevronContainer: {
    marginLeft: 4,
  },
});

export default CalendarEventCard;
