import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Share, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { Text, ActivityIndicator } from '@/components/ui';
import { FALLBACK_IMAGES, PET_TYPE_AVATARS } from '@/constants/images';
import { useTheme } from '@/lib/theme';
import { usePet, useDeletePet } from '@/lib/hooks/usePets';
import { useEvents } from '@/lib/hooks/useEvents';
import { useHealthRecords } from '@/lib/hooks/useHealthRecords';
import { useActiveFeedingSchedulesByPet } from '@/lib/hooks/useFeedingSchedules';
import { formatTimeForDisplay, getNextFeedingTime, getPreviousFeedingTime } from '@/lib/schemas/feedingScheduleSchema';
import { PetModal } from '@/components/PetModal';
import { showToast } from '@/lib/toast/showToast';
import { TAB_ROUTES } from '@/constants/routes';

const { width } = Dimensions.get('window');

const BOTTOM_BAR_HEIGHT = 80;

function sortByDateDesc<T>(items: T[], getDate: (item: T) => string | Date): T[] {
  return [...items].sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime());
}

export default function PetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const footerStyles = useMemo(() => StyleSheet.create({
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      padding: 16,
      paddingBottom: insets.bottom + 16,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    bottomBarInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      maxWidth: 500,
      alignSelf: 'center',
      width: '100%',
    },
    editButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    editButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
  }), [theme, insets]);

  const petId = id ?? '';
  const { data: pet, isLoading: isPetLoading } = usePet(petId);
  const { data: events, isLoading: isEventsLoading } = useEvents(petId);
  const { data: healthRecords } = useHealthRecords(petId);
  const { data: feedingSchedules = [] } = useActiveFeedingSchedulesByPet(petId);
  const deletePetMutation = useDeletePet();

  const [editModalVisible, setEditModalVisible] = useState(false);

  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const age = useMemo(() => {
    if (!pet?.birthDate) return t('pets.ageUnknown');

    const birthDate = new Date(pet.birthDate);
    const today = new Date();
    const years = differenceInYears(today, birthDate);
    const months = differenceInMonths(today, birthDate) % 12;

    if (years > 0) {
      if (months > 0) return `${years} ${t('pets.years')} ${months} ${t('pets.months')}`;
      return `${years} ${t('pets.years')}`;
    }

    return `${months} ${t('pets.months')}`;
  }, [pet?.birthDate, t]);

  const nextFeedingSchedule = useMemo(() => {
    if (!feedingSchedules.length) return null;

    const nextTime = getNextFeedingTime(feedingSchedules);
    if (!nextTime) return null;

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[nextTime.getDay()];
    const hhmm = format(nextTime, 'HH:mm');

    return (
      feedingSchedules.find((schedule) =>
        schedule.isActive &&
        schedule.time === hhmm &&
        schedule.days.toLowerCase().includes(dayName)
      ) ??
      [...feedingSchedules]
        .filter((schedule) => schedule.isActive)
        .sort((a, b) => a.time.localeCompare(b.time))[0] ??
      null
    );
  }, [feedingSchedules]);

  const nextFeedingTime = useMemo(() => {
    return getNextFeedingTime(feedingSchedules);
  }, [feedingSchedules]);

  const timeUntilFeeding = useMemo(() => {
    if (!nextFeedingTime) return null;

    const now = new Date();
    const diffMs = nextFeedingTime.getTime() - now.getTime();

    if (diffMs <= 0) return null;

    const totalMinutes = Math.ceil(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) return t('common.hoursMinutes', { hours, minutes });
    return t('common.minutesOnly', { minutes });
  }, [nextFeedingTime, t]);

  const previousFeedingTime = useMemo(() => {
    return getPreviousFeedingTime(feedingSchedules);
  }, [feedingSchedules]);

  const feedingProgress = useMemo(() => {
    if (!nextFeedingTime || !previousFeedingTime) return 0;

    const now = new Date();
    const intervalMs = nextFeedingTime.getTime() - previousFeedingTime.getTime();
    const elapsedMs = now.getTime() - previousFeedingTime.getTime();

    if (intervalMs <= 0) return 0;

    const progress = (elapsedMs / intervalMs) * 100;
    return Math.max(0, Math.min(100, progress));
  }, [nextFeedingTime, previousFeedingTime]);

  const recentActivities = useMemo(() => {
    if (!events?.length) return [];
    return sortByDateDesc(events, (e) => e.startTime).slice(0, 3);
  }, [events]);

  const recentHealth = useMemo(() => {
    if (!healthRecords?.length) return [];
    return sortByDateDesc(healthRecords, (r) => r.date).slice(0, 2);
  }, [healthRecords]);

  const handleShare = async () => {
    if (!pet) return;

    await Share.share({
      message: t('pets.shareMessage', {
        name: pet.name,
        breed: pet.breed ?? '',
      }),
    });
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleDelete = () => {
    if (!pet) return;

    const performDelete = async () => {
      try {
        await deletePetMutation.mutateAsync(pet._id);
        router.back();
      } catch {
        showToast({
          type: 'error',
          title: t('common.error'),
          message: t('pets.deleteError'),
        });
      }
    };

    Alert.alert(
      t('pets.deletePet'),
      t('pets.deleteConfirmation', { name: pet.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };

  const getGenderIcon = (gender: string) => {
    if (gender === 'female') return 'female';
    if (gender === 'male') return 'male';
    return 'male-female';
  };

  const getGenderColor = (gender: string) => {
    if (gender === 'female') return theme.colors.genderFemale;
    if (gender === 'male') return theme.colors.genderMale;
    return theme.colors.outline;
  };

  if (isPetLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background, padding: 24 }]}>
        <Text style={{ color: theme.colors.onBackground, textAlign: 'center', fontWeight: '700' }}>{t('pets.notFound')}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.fallbackButton, { borderColor: theme.colors.outlineVariant }]}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
        >
          <Text style={{ color: theme.colors.onBackground, fontWeight: '700' }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const heroSource = pet.profilePhoto
    ? { uri: pet.profilePhoto }
    : PET_TYPE_AVATARS[pet.type.toLowerCase() as keyof typeof PET_TYPE_AVATARS] ?? FALLBACK_IMAGES.petHero;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_HEIGHT + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <Image source={heroSource} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', theme.colors.scrim, theme.colors.background]}
            style={styles.heroGradient}
          />

          <View style={styles.heroContent}>
            <Text style={[styles.heroName, { color: theme.colors.onBackground }]}>{pet.name}</Text>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[styles.heroActionButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
                onPress={() => router.push({ pathname: TAB_ROUTES.calendar, params: { petId: pet._id, action: 'create' } })}
                accessibilityLabel={t('events.addEvent')}
                accessibilityRole="button"
              >
                <MaterialIcons name="add" size={20} color={theme.colors.onPrimary} />
                <Text style={[styles.heroActionText, { color: theme.colors.onPrimary }]}>{t('events.addEvent')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.headerBar, { top: insets.top + 10 }]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconButtonBlur, { backgroundColor: theme.colors.overlay, borderColor: theme.colors.overlayLight }]}
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.iconButtonBlur, { backgroundColor: theme.colors.overlay, borderColor: theme.colors.overlayLight }]}
            accessibilityLabel={t('pets.sharePet')}
            accessibilityHint={t('pets.sharePetHint')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="share-variant" size={24} color={theme.colors.onBackground} />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.grid}>
            <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryContainer }]}>
                <MaterialIcons name="pets" size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{t('pets.type')}</Text>
                <Text style={[styles.value, { color: theme.colors.onSurface }]}>{t(`petTypes.${pet.type.toLowerCase()}`, pet.type)}</Text>
              </View>
              <MaterialIcons name="pets" size={48} color={theme.colors.onSurface} style={styles.bgIcon} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.infoContainer }]}>
                <MaterialCommunityIcons name="cake-variant" size={20} color={theme.colors.info} />
              </View>
              <View>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{t('pets.age')}</Text>
                <Text style={[styles.value, { color: theme.colors.onSurface }]}>{age}</Text>
              </View>
              <MaterialCommunityIcons name="cake-variant" size={48} color={theme.colors.onSurface} style={styles.bgIcon} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
              <View style={[styles.iconBox, { backgroundColor: pet.gender === 'female' ? theme.colors.genderFemaleContainer : theme.colors.genderMaleContainer }]}>
                <Ionicons name={getGenderIcon(pet.gender ?? '')} size={20} color={getGenderColor(pet.gender ?? '')} />
              </View>
              <View>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{t('pets.gender')}</Text>
                <Text style={[styles.value, { color: theme.colors.onSurface }]}>
                  {pet.gender === 'male' ? t('pets.male') : pet.gender === 'female' ? t('pets.female') : t('common.notSpecified')}
                </Text>
              </View>
              <Ionicons name={getGenderIcon(pet.gender ?? '')} size={48} color={theme.colors.onSurface} style={styles.bgIcon} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.warningContainer }]}>
                <MaterialCommunityIcons name="scale-bathroom" size={20} color={theme.colors.warning} />
              </View>
              <View>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{t('pets.weight')}</Text>
                <Text style={[styles.value, { color: theme.colors.onSurface }]}>{pet.weight ? `${pet.weight} kg` : t('common.notSpecified')}</Text>
              </View>
              <MaterialCommunityIcons name="scale-bathroom" size={48} color={theme.colors.onSurface} style={styles.bgIcon} />
            </View>
          </View>

          {nextFeedingTime && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{t('pets.nextFeedingTime')}</Text>
                {timeUntilFeeding && (
                  <View style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.primary }]}>{t('common.timeLeft', { time: timeUntilFeeding })}</Text>
                  </View>
                )}
              </View>
              <View style={[styles.wideCard, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
                <View style={styles.feedingRow}>
                  <View style={styles.feedingInfo}>
                    <View style={[styles.iconBoxLarge, { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.overlayLight }]}>
                      <MaterialIcons name="restaurant" size={24} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                        {nextFeedingSchedule?.foodType
                          ? t(`foodTypes.${nextFeedingSchedule.foodType}`, nextFeedingSchedule.foodType)
                          : t('eventTypes.feeding')}
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                        {nextFeedingSchedule?.amount || t('pets.feedingDefaultSubtitle')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.timeText, { color: theme.colors.onSurface }]}>
                    {nextFeedingSchedule ? formatTimeForDisplay(nextFeedingSchedule.time) : format(nextFeedingTime, 'HH:mm')}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: theme.colors.overlayLight }]}>
                  <View style={[styles.progressBarFill, { backgroundColor: theme.colors.primary, width: `${Math.round(feedingProgress)}%` }]} />
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{t('pets.recentActivities')}</Text>
              <TouchableOpacity
                style={[styles.iconButtonSmall, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}
                accessibilityLabel={t('pets.viewActivityHistory')}
                accessibilityRole="button"
              >
                <MaterialIcons name="history" size={20} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={[styles.timelineCard, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
              <View style={[styles.timelineLine, { backgroundColor: theme.colors.outlineVariant }]} />

              {isEventsLoading ? (
                <View style={{ padding: 16 }}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <View key={activity._id} style={[styles.timelineItem, index === recentActivities.length - 1 && styles.lastItem]}>
                    <View style={styles.timelineIconContainer}>
                      <View style={[styles.timelineIcon, { backgroundColor: theme.colors.secondaryContainer, borderColor: theme.colors.secondary }]}>
                        <MaterialIcons name="pets" size={16} color={theme.colors.secondary} />
                      </View>
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={[styles.timelineTitle, { color: theme.colors.onSurface }]}>
                          {activity.title || t(`eventTypes.${activity.type}`, activity.type)}
                        </Text>
                        <Text style={[styles.timelineTime, { color: theme.colors.onSurfaceVariant }]}>
                          {format(new Date(activity.startTime), 'HH:mm')}
                        </Text>
                      </View>
                      <Text style={[styles.timelineDesc, { color: theme.colors.onSurfaceVariant }]}>
                        {activity.description || activity.notes || t('common.noNotes')}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ color: theme.colors.onSurfaceVariant, padding: 16 }}>{t('common.noData')}</Text>
              )}
            </View>
          </View>

          <View style={[styles.section, { marginBottom: 24 }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{t('pets.healthStatus')}</Text>
              <TouchableOpacity
                onPress={() => router.push(TAB_ROUTES.care)}
                accessibilityLabel={t('pets.viewHealthDetails')}
                accessibilityRole="button"
              >
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>{t('common.details')}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.timelineCard, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
              <View style={[styles.timelineLine, { backgroundColor: theme.colors.outlineVariant }]} />

              {recentHealth.length > 0 ? (
                recentHealth.map((record, index) => (
                  <View key={record._id} style={[styles.timelineItem, index === recentHealth.length - 1 && styles.lastItem]}>
                    <View style={styles.timelineIconContainer}>
                      <View style={[styles.timelineIcon, { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error }]}>
                        <MaterialCommunityIcons name="stethoscope" size={16} color={theme.colors.error} />
                      </View>
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={[styles.timelineTitle, { color: theme.colors.onSurface }]}>
                          {t(`healthRecordTypes.${record.type}`, record.type)}
                        </Text>
                        <Text style={[styles.timelineTime, { color: theme.colors.onSurfaceVariant }]}>
                          {format(new Date(record.date), 'd MMM', { locale: dateLocale })}
                        </Text>
                      </View>
                      <Text style={[styles.timelineDesc, { color: theme.colors.onSurfaceVariant }]}>
                        {record.description || record.notes || t('common.noNotes')}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ color: theme.colors.onSurfaceVariant, padding: 16 }}>{t('common.noData')}</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={footerStyles.bottomBar}>
        <View style={footerStyles.bottomBarInner}>
          <TouchableOpacity
            style={footerStyles.editButton}
            onPress={handleEdit}
            accessibilityLabel={t('common.edit')}
            accessibilityHint={t('pets.editPetHint')}
            accessibilityRole="button"
          >
            <MaterialIcons name="edit" size={20} color={theme.colors.onPrimary} />
            <Text style={footerStyles.editButtonText}>{t('common.edit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[footerStyles.iconButton, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant }]}
            onPress={handleShare}
            accessibilityLabel={t('pets.sharePet')}
            accessibilityHint={t('pets.sharePetHint')}
            accessibilityRole="button"
          >
            <MaterialIcons name="share" size={22} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[footerStyles.iconButton, { borderColor: theme.colors.errorContainer, backgroundColor: 'transparent' }]}
            onPress={handleDelete}
            accessibilityLabel={t('pets.deletePet')}
            accessibilityHint={t('pets.deleteConfirmation', { name: pet.name })}
            accessibilityRole="button"
          >
            <MaterialIcons name="delete" size={22} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <PetModal
        visible={editModalVisible}
        pet={pet}
        onClose={() => setEditModalVisible(false)}
        onSuccess={() => setEditModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackButton: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroContainer: {
    height: 400,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: BOTTOM_BAR_HEIGHT,
    zIndex: 1,
  },
  heroName: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: 12,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  heroActionText: {
    fontWeight: '700',
    fontSize: 13,
  },
  headerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  contentContainer: {
    marginTop: -40,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: (width - 32 - 12) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  bgIcon: {
    position: 'absolute',
    right: -10,
    top: -10,
    opacity: 0.1,
    transform: [{ rotate: '-15deg' }],
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  wideCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  feedingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  feedingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBoxLarge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  iconButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  timelineCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 39,
    top: 24,
    bottom: 24,
    width: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  lastItem: {
    marginBottom: 0,
  },
  timelineIconContainer: {
    alignItems: 'center',
    width: 40,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 10,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  timelineTime: {
    fontSize: 12,
  },
  timelineDesc: {
    fontSize: 12,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
