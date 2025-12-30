import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Share } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Text, ActivityIndicator } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { usePet } from '@/lib/hooks/usePets';
import { useEvents } from '@/lib/hooks/useEvents';
import { useHealthRecords } from '@/lib/hooks/useHealthRecords';
import { useActiveFeedingSchedulesByPet } from '@/lib/hooks/useFeedingSchedules';
import { formatTimeForDisplay, getNextFeedingTime } from '@/lib/schemas/feedingScheduleSchema';

const { width } = Dimensions.get('window');

export default function PetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const petId = id ?? '';
  const { data: pet, isLoading: isPetLoading } = usePet(petId);
  const { data: events, isLoading: isEventsLoading } = useEvents(petId);
  const { data: healthRecords } = useHealthRecords(petId);
  const { data: feedingSchedules = [] } = useActiveFeedingSchedulesByPet(petId);

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

  const recentActivities = useMemo(() => {
    if (!events?.length) return [];

    return [...events]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 3);
  }, [events]);

  const recentHealth = useMemo(() => {
    if (!healthRecords?.length) return [];

    return [...healthRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2);
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

  const getGenderIcon = (gender: string) => {
    if (gender === 'female') return 'female';
    if (gender === 'male') return 'male';
    return 'male-female';
  };

  const getGenderColor = (gender: string) => {
    if (gender === 'female') return '#EC4899';
    if (gender === 'male') return '#3B82F6';
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
        <TouchableOpacity onPress={() => router.back()} style={[styles.fallbackButton, { borderColor: theme.colors.outlineVariant }]}>
          <Text style={{ color: theme.colors.onBackground, fontWeight: '700' }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const heroSource = pet.profilePhoto
    ? { uri: pet.profilePhoto }
    : require('@/assets/images/background.png');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <Image source={heroSource} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.12)', theme.colors.background]}
            style={styles.heroGradient}
          />

          <View style={styles.heroContent}>
            <Text style={[styles.heroName, { color: theme.colors.onBackground }]}>{pet.name}</Text>
          </View>
        </View>

        <View style={[styles.headerBar, { top: insets.top + 10 }]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButtonBlur}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButtonBlur}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
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
              <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="cake-variant" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{t('pets.age')}</Text>
                <Text style={[styles.value, { color: theme.colors.onSurface }]}>{age}</Text>
              </View>
              <MaterialCommunityIcons name="cake-variant" size={48} color={theme.colors.onSurface} style={styles.bgIcon} />
            </View>

            <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
              <View style={[styles.iconBox, { backgroundColor: pet.gender === 'female' ? '#FCE7F3' : '#DBEAFE' }]}>
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
              <View style={[styles.iconBox, { backgroundColor: '#FFEDD5' }]}>
                <MaterialCommunityIcons name="scale-bathroom" size={20} color="#F97316" />
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
                    <View style={[styles.iconBoxLarge, { backgroundColor: theme.colors.primaryContainer }]}>
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
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { backgroundColor: theme.colors.primary, width: '75%' }]} />
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{t('pets.recentActivities')}</Text>
              <TouchableOpacity style={[styles.iconButtonSmall, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
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
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>{t('common.details')}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.timelineCard, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
              <View style={[styles.timelineLine, { backgroundColor: theme.colors.outlineVariant }]} />

              {recentHealth.length > 0 ? (
                recentHealth.map((record, index) => (
                  <View key={record._id} style={[styles.timelineItem, index === recentHealth.length - 1 && styles.lastItem]}>
                    <View style={styles.timelineIconContainer}>
                      <View style={[styles.timelineIcon, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                        <MaterialCommunityIcons name="stethoscope" size={16} color="#EF4444" />
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

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <TouchableOpacity style={styles.actionButtonColumn} onPress={() => {}}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="edit" size={24} color={theme.colors.onSurfaceVariant} />
          </View>
          <Text style={[styles.actionLabel, { color: theme.colors.onSurfaceVariant }]}>{t('common.edit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainActionButton, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]}
          onPress={() => router.push({ pathname: '/(tabs)/calendar', params: { petId: pet._id, action: 'create' } })}
        >
          <MaterialIcons name="add" size={24} color={theme.colors.onPrimary} />
          <Text style={[styles.mainActionText, { color: theme.colors.onPrimary }]}>{t('events.addEvent')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonColumn} onPress={handleShare}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="share" size={24} color={theme.colors.onSurfaceVariant} />
          </View>
          <Text style={[styles.actionLabel, { color: theme.colors.onSurfaceVariant }]}>{t('common.share')}</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 120,
    zIndex: 1,
  },
  heroName: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    borderColor: 'rgba(255,255,255,0.1)',
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
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  actionButtonColumn: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  iconCircle: {
    padding: 8,
    borderRadius: 20,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 24,
    gap: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  mainActionText: {
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
