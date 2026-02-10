import React from 'react';
import { View, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import { Text, IconButton, Switch } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';
import { FeedingSchedule } from '../../lib/types';
import { formatTimeForDisplay, normalizeFeedingDays } from '../../lib/schemas/feedingScheduleSchema';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FeedingScheduleCardProps {
  schedule: FeedingSchedule;
  onPress?: (schedule: FeedingSchedule) => void;
  onEdit?: (schedule: FeedingSchedule) => void;
  onDelete?: (schedule: FeedingSchedule) => void;
  onToggleActive?: (schedule: FeedingSchedule, isActive: boolean) => void;
  showPetInfo?: boolean;
  showActions?: boolean;
  compact?: boolean;
  testID?: string;
  petName?: string;
}

export function FeedingScheduleCard({
  schedule,
  onPress,
  onEdit,
  onDelete,
  onToggleActive,
  showPetInfo = true,
  showActions = true,
  compact = false,
  testID,
  petName,
}: FeedingScheduleCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const daysArray = normalizeFeedingDays(schedule.days);

  const handlePress = React.useCallback(() => {
    onPress?.(schedule);
  }, [onPress, schedule]);

  const handleEdit = React.useCallback((e: GestureResponderEvent) => {
    e.stopPropagation();
    onEdit?.(schedule);
  }, [onEdit, schedule]);

  const handleDelete = React.useCallback((e: GestureResponderEvent) => {
    e.stopPropagation();
    onDelete?.(schedule);
  }, [onDelete, schedule]);

  const handleToggleActive = React.useCallback((value: boolean) => {
    onToggleActive?.(schedule, value);
  }, [onToggleActive, schedule]);

  const cardStyle = compact ? styles.compactCard : styles.card;
  const contentStyle = compact ? styles.compactContent : styles.content;

  // Color based on food type
  const getFoodTypeConfig = () => {
    const configs: Record<string, { color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
      dry_food: { color: '#FF9F76', icon: 'food-drumstick' },
      wet_food: { color: '#A0AEC0', icon: 'bowl-mix' },
      raw_food: { color: '#FF6B8B', icon: 'food-steak' },
      homemade: { color: '#6EE7B7', icon: 'pot-steam' },
      treats: { color: '#FFD34E', icon: 'cookie' },
      supplements: { color: '#C084FC', icon: 'pill' },
      other: { color: '#CBD5E1', icon: 'food-apple' },
    };
    return configs[schedule.foodType] || { color: theme.colors.primary, icon: 'food' };
  };

  const { color: foodTypeColor, icon: foodTypeIcon } = getFoodTypeConfig();
  const activeDays = new Set(daysArray.map((day) => day.toLowerCase()));
  const daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  return (
    <Pressable
      onPress={handlePress}
      style={[
        cardStyle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: schedule.isActive ? `${foodTypeColor}4D` : theme.colors.surfaceVariant,
          borderWidth: 1,
          opacity: schedule.isActive ? 1 : 0.6,
        }
      ]}
      testID={testID}
    >
      <View style={contentStyle}>
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor: foodTypeColor,
              borderTopLeftRadius: compact ? 16 : 20,
              borderBottomLeftRadius: compact ? 16 : 20,
            },
          ]}
        />

        <View style={styles.header}>
          <View style={styles.timeContainer}>
            <View style={[styles.timeIcon, { backgroundColor: `${foodTypeColor}1A` }]}>
              <MaterialCommunityIcons name={foodTypeIcon} size={20} color={foodTypeColor} />
            </View>
            <View style={styles.timeInfo}>
              <Text
                variant="headlineSmall"
                style={[styles.time, { color: theme.colors.onSurface }]}
              >
                {formatTimeForDisplay(schedule.time)}
              </Text>
              <Text
                variant="labelMedium"
                style={[styles.foodTypeLabel, { color: foodTypeColor }]}
              >
                {t(`foodTypes.${schedule.foodType}`)}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {showActions && onToggleActive && (
              <Switch
                value={schedule.isActive}
                onValueChange={handleToggleActive}
                color={foodTypeColor}
                testID={`${testID}-toggle`}
              />
            )}
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="scale" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {schedule.amount}
            </Text>
          </View>
          {showPetInfo && (
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="paw" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {petName ? `${t('feedingSchedule.forPet')} ${petName}` : t('feedingSchedule.forPet')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.daysRow}>
          {daysOfWeek.map((day) => {
            const isActiveDay = activeDays.has(day);
            const label = t(`days.${day}`).substring(0, 1).toUpperCase();
            return (
              <View
                key={day}
                style={[
                  styles.dayBadge,
                  {
                    backgroundColor: isActiveDay
                      ? foodTypeColor
                      : theme.colors.surfaceVariant,
                  },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={{
                    color: isActiveDay ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                    fontWeight: '700',
                  }}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: schedule.isActive
                    ? theme.colors.secondary
                    : theme.colors.surfaceDisabled,
                },
              ]}
            />
            <Text
              variant="labelSmall"
              style={[
                styles.statusText,
                {
                  color: schedule.isActive
                    ? theme.colors.secondary
                    : theme.colors.surfaceDisabled,
                },
              ]}
            >
              {schedule.isActive ? t('feedingSchedule.active') : t('feedingSchedule.inactive')}
            </Text>
          </View>

          {showActions && (
            <View style={styles.actions}>
              {onEdit && (
                <IconButton
                  icon="pencil"
                  size={18}
                  iconColor={theme.colors.onSurfaceVariant}
                  onPress={handleEdit}
                  testID={`${testID}-edit`}
                />
              )}
              {onDelete && (
                <IconButton
                  icon="delete"
                  size={18}
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
    borderRadius: 20,
    marginBottom: 12,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  compactCard: {
    borderRadius: 16,
    marginBottom: 8,
    marginHorizontal: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  content: {
    padding: 18,
  },
  compactContent: {
    padding: 14,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  timeInfo: {
    flex: 1,
  },
  time: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  foodTypeLabel: {
    fontWeight: '600',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchContainer: {
    marginLeft: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dayBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
  },
});

export default FeedingScheduleCard;
