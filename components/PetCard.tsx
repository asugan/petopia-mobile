import { Avatar, Surface, Text } from '@/components/ui';
import { FALLBACK_IMAGES } from '@/constants/images';
import { useTheme } from '@/lib/theme';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Pet } from '../lib/types';
import { usePetNextActivity } from '@/lib/hooks/usePetNextActivity';
import { NextActivity } from '@/lib/utils/activityUtils';

interface PetCardProps {
  pet: Pet;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  petId?: string; // Optional petId for hook usage
  nextActivity?: NextActivity | null; // Backward compatibility
}

const PetCard: React.FC<PetCardProps> = ({
  pet,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
  petId,
  nextActivity: propNextActivity,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Use hook if petId is provided, otherwise use prop for backward compatibility
  const { nextActivity: hookNextActivity, isLoading } = usePetNextActivity(petId || pet._id);
  const nextActivity = petId ? hookNextActivity : propNextActivity;

  const getPetTypeLabel = (type: string) => {
    const typeKey = type.toLowerCase();
    return t('petTypes.' + typeKey, type); // Fallback to original type if translation not found
  };

  const getPetTypeColor = (type: string): string => {
    const typeColors = {
      cat: theme.colors.secondary,
      dog: theme.colors.tertiary,
      bird: theme.colors.primary,
      fish: theme.colors.inversePrimary,
      rabbit: theme.colors.secondaryContainer,
      hamster: theme.colors.tertiaryContainer,
      reptile: theme.colors.surfaceVariant,
      default: theme.colors.primary,
    };
    return typeColors[type.toLowerCase() as keyof typeof typeColors] || typeColors.default;
  };

  // Determine ring color based on next activity priority or type
  const getRingColor = () => {
    if (nextActivity) {
      if (nextActivity.type === 'vaccination' || nextActivity.type === 'medication') {
        return theme.colors.accent; // Orange for health priority
      }
      if (nextActivity.type === 'vet') {
        return theme.colors.secondary; // Purple for vet appointments
      }
      return nextActivity.color || theme.colors.primary; // Use activity color or default
    }
    return theme.colors.primary; // Default cyan
  };

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Surface
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: '#4B5563',
            borderWidth: 1,
          },
        ]}
        elevation={2}
      >
        <View style={[styles.content, { padding: 12 }]}>
          <View style={styles.horizontalLayout}>
            {/* Avatar */}
            <View style={[styles.avatarRing, { borderColor: getRingColor(), borderWidth: 2 }]}>
              <Avatar.Image
                size={56}
                source={pet.profilePhoto ? { uri: pet.profilePhoto } : FALLBACK_IMAGES.petAvatar}
                style={styles.avatar}
              />
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Text
                variant="titleMedium"
                style={[styles.name, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {pet.name}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.typeText, { color: theme.colors.onSurfaceVariant }]}
              >
                {getPetTypeLabel(pet.type)}
              </Text>
            </View>

            {/* Next Activity */}
            {petId && isLoading && (
              <View style={styles.activityContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text
                  variant="bodySmall"
                  style={[styles.activityLabel, { color: theme.colors.onSurfaceVariant }]}
                >
                  {t('common.loading')}
                </Text>
              </View>
            )}

            {!isLoading && nextActivity && (
              <View style={styles.activityContainer}>
                <Text
                  variant="bodySmall"
                  style={[styles.activityLabel, { color: theme.colors.onSurfaceVariant }]}
                >
                  {t('home.nextActivity')}:
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[styles.activityText, { color: nextActivity.color }]}
                  numberOfLines={1}
                >
                  {nextActivity.label} ({nextActivity.time})
                </Text>
              </View>
            )}

            {!isLoading && !nextActivity && petId && (
              <View style={styles.activityContainer}>
                <Text
                  variant="bodySmall"
                  style={[styles.activityLabel, { color: theme.colors.onSurfaceVariant }]}
                >
                  {t('home.noActivity')}:
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[styles.activityText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {t('home.allSet')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Surface>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
  },
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    marginBottom: 2,
  },
  typeText: {
    fontSize: 14,
  },
  activityContainer: {
    alignItems: 'flex-end',
  },
  activityLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  activityText: {
    fontWeight: '600',
    fontSize: 14,
  },
});

export default PetCard;