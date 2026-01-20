import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Avatar, Surface, Text } from '@/components/ui';
import { usePetNextActivity } from '@/lib/hooks/usePetNextActivity';
import { useTheme } from '@/lib/theme';
import { Pet } from '@/lib/types';
import { NextActivity } from '@/lib/utils/activityUtils';
import { getPetTypeAvatar } from '@/lib/utils/petTypeVisuals';

interface PetListCardProps {
  pet: Pet;
  onPress?: () => void;
  petId?: string;
  filterMode?: 'all' | 'urgent';
  onUrgencyChange?: (petId: string, isUrgent: boolean, isLoading: boolean) => void;
}

const getAgeText = (birthDate: string | Date | undefined, t: (key: string) => string) => {
  if (!birthDate) return t('pets.ageUnknown');
  const date = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(date.getTime())) return t('pets.ageUnknown');

  const now = new Date();
  const totalMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  if (totalMonths < 0) return t('pets.ageUnknown');

  if (totalMonths < 12) {
    return `${totalMonths} ${t('pets.months')}`;
  }

  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;
  if (remainingMonths === 0) {
    return `${years} ${t('pets.years')}`;
  }

  return `${years} ${t('pets.years')} ${remainingMonths} ${t('pets.months')}`;
};

const getActivityLabel = (activity: NextActivity, t: (key: string) => string) => {
  switch (activity.type) {
    case 'vaccination':
      return t('eventTypes.vaccination');
    case 'medication':
      return t('eventTypes.medication');
    case 'vet':
      return t('eventTypes.vetVisit');
    case 'feeding':
      return t('eventTypes.feeding');
    default:
      return activity.label;
  }
};

const getActivityIcon = (activity: NextActivity) => {
  switch (activity.type) {
    case 'vaccination':
      return 'shield-checkmark-outline';
    case 'medication':
      return 'medkit-outline';
    case 'vet':
      return 'calendar-outline';
    case 'feeding':
      return 'restaurant-outline';
    default:
      return 'calendar-outline';
  }
};

const PetListCard: React.FC<PetListCardProps> = ({
  pet,
  onPress,
  petId,
  filterMode = 'all',
  onUrgencyChange,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { nextActivity, isLoading } = usePetNextActivity(petId || pet._id);

  const typeLabel = t(`petTypes.${pet.type}`, pet.type);
  const ageText = getAgeText(pet.birthDate, t);
  const subtitle = pet.breed ? `${pet.breed} - ${ageText}` : `${typeLabel} - ${ageText}`;

  const showAttention = nextActivity?.type === 'vaccination' || nextActivity?.type === 'medication' || nextActivity?.type === 'vet';
  const statusColor = showAttention ? theme.colors.warning : theme.colors.success;
  const statusIconColor = showAttention ? theme.colors.onWarning : theme.colors.onSuccess;

  const activityLabel = nextActivity ? getActivityLabel(nextActivity, t) : t('home.noActivity');
  const activityText = nextActivity?.time ? `${activityLabel}: ${nextActivity.time}` : activityLabel;
  const activityColor = nextActivity ? theme.colors.primary : theme.colors.onSurfaceVariant;

  useEffect(() => {
    if (!onUrgencyChange) return;
    onUrgencyChange(petId || pet._id, !!showAttention, isLoading);
  }, [isLoading, onUrgencyChange, petId, pet._id, showAttention]);

  if (filterMode === 'urgent' && !showAttention) {
    return null;
  }

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Surface
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        elevation={0}
      >
        <View style={styles.content}>
          <View style={styles.avatarWrap}>
            {pet.profilePhoto ? (
              <Avatar.Image size={64} source={{ uri: pet.profilePhoto }} style={styles.avatar} />
            ) : (
              <Avatar.Image size={64} source={getPetTypeAvatar(pet.type)} style={styles.avatar} />
            )}
            <View style={[styles.statusBadge, { backgroundColor: statusColor, borderColor: theme.colors.surface }]}>
              <Ionicons name={showAttention ? 'alert-outline' : 'checkmark'} size={12} color={statusIconColor} />
            </View>
          </View>

          <View style={styles.details}>
            <Text variant="titleMedium" style={[styles.name, { color: theme.colors.onSurface }]} numberOfLines={1}>
              {pet.name}
            </Text>
            <Text variant="bodySmall" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
              {subtitle}
            </Text>
            <View style={styles.activityRow}>
              {isLoading ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('common.loading')}
                </Text>
              ) : (
                <>
                  <Ionicons
                    name={nextActivity ? getActivityIcon(nextActivity) : 'notifications-off-outline'}
                    size={16}
                    color={activityColor}
                    style={styles.activityIcon}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.activityText, { color: activityColor }]}
                    numberOfLines={1}
                  >
                    {activityText}
                  </Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
          </View>
        </View>
      </Surface>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    borderRadius: 32,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  activityIcon: {
    marginRight: 6,
  },
  activityText: {
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 8,
  },
});

export default PetListCard;
