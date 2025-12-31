import React, { useEffect, useMemo, useState } from 'react';

import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getEventTypeLabel } from '@/constants/eventIcons';
import { useReminderScheduler } from '@/hooks/useReminderScheduler';
import { useCreateEvent, useDeleteEvent, useEvent } from '@/lib/hooks/useEvents';
import { usePet } from '@/lib/hooks/usePets';
import { useTheme } from '@/lib/theme';
import { useEventReminderStore } from '@/stores/eventReminderStore';

export default function EventDetailScreen() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const locale = i18n.language === 'tr' ? tr : enUS;
  const insets = useSafeAreaInsets();

  const { data: event, isLoading, error } = useEvent(id);
  const { data: pet } = usePet(event?.petId || '');
  const deleteEventMutation = useDeleteEvent();
  const createEventMutation = useCreateEvent();
  const reminderStatus = useEventReminderStore((state) => (event?._id ? state.statuses[event._id] : undefined));
  const presetSelections = useEventReminderStore((state) => state.presetSelections);
  const markMissed = useEventReminderStore((state) => state.markMissed);
  const markCancelled = useEventReminderStore((state) => state.markCancelled);
  const resetStatus = useEventReminderStore((state) => state.resetStatus);
  const { cancelRemindersForEvent, scheduleChainForEvent } = useReminderScheduler();

  const [eventStatus, setEventStatus] = useState<'upcoming' | 'completed' | 'cancelled' | 'missed'>('upcoming');

  const COLORS = {
    primary: theme.colors.primary,
    backgroundLight: theme.colors.background,
    backgroundDark: theme.colors.background,
    surfaceDark: theme.colors.surface,
    surfaceDarker: theme.colors.surfaceVariant,
    white: theme.colors.onSurface,
    gray400: theme.colors.onSurfaceVariant,
    gray300: theme.colors.onSurface,
    blackOp20: "rgba(0,0,0,0.2)",
    blackOp40: "rgba(0,0,0,0.4)",
    red400: theme.colors.error,
    red500Op10: "rgba(239, 68, 68, 0.1)",
  };

  const handleEdit = () => {
    if (event) {
      router.push({
        pathname: '/(tabs)/calendar',
        params: { editEventId: event._id }
      });
    }
  };

  const handleDelete = () => {
    if (!event) return;

    Alert.alert(
      t('events.deleteEvent'),
      t('events.deleteEventConfirmation', { title: event.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEventMutation.mutateAsync(event._id);
              router.back();
            } catch (error) {
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleDuplicate = async () => {
    if (!event) return;
    try {
      const newStartTime = new Date(event.startTime);
      newStartTime.setDate(newStartTime.getDate() + 1);
      const newEndTime = event.endTime ? new Date(event.endTime) : null;
      if (newEndTime) newEndTime.setDate(newEndTime.getDate() + 1);

      const duplicatedEvent = {
        petId: event.petId,
        type: event.type,
        title: `${event.title} (${t('events.copy')})`,
        description: event.description,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime?.toISOString() || undefined,
        location: event.location,
        reminder: event.reminder,
        notes: event.notes,
        vaccineName: event.vaccineName,
        vaccineManufacturer: event.vaccineManufacturer,
        batchNumber: event.batchNumber,
        medicationName: event.medicationName,
        dosage: event.dosage,
        frequency: event.frequency,
        reminderPresetKey: event._id ? presetSelections[event._id] : undefined,
      };
      await createEventMutation.mutateAsync(duplicatedEvent);
      Alert.alert(t('common.success'), t('events.eventDuplicated'));
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      const eventDate = format(new Date(event.startTime), 'dd MMMM yyyy', { locale });
      const eventTime = format(new Date(event.startTime), 'HH:mm', { locale });
      const shareMessage = `📅 ${event.title}\n🐾 ${pet?.name || t('events.pet')}\n📍 ${event.location || t('events.noLocation')}\n🕐 ${eventDate} - ${eventTime}\n\n${event.description || ''}\n\n${t('events.sharedFrom')} PawPa`;
      await Share.share({ message: shareMessage, title: event.title });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const derivedStatus = useMemo(() => {
    if (!event) return 'upcoming';
    if (reminderStatus?.status === 'completed') return 'completed';
    if (reminderStatus?.status === 'cancelled') return 'cancelled';
    if (reminderStatus?.status === 'missed') return 'missed';
    const start = new Date(event.startTime);
    return start < new Date() ? 'missed' : 'upcoming';
  }, [event, reminderStatus]);

  useEffect(() => {
    if (!event) return;
    setEventStatus(derivedStatus);
    if (derivedStatus === 'missed' && reminderStatus?.status !== 'missed') {
      markMissed(event._id);
      void cancelRemindersForEvent(event._id);
    }
  }, [cancelRemindersForEvent, derivedStatus, event, markMissed, reminderStatus]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: COLORS.backgroundDark }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!event || error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: COLORS.backgroundDark }]}>
        <Text style={{ color: COLORS.white }}>{t('events.eventNotFound')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.buttonSecondary, { backgroundColor: COLORS.surfaceDark }]}>
          <Text style={{ color: COLORS.white }}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateStr = format(new Date(event.startTime), 'MMM dd, yyyy', { locale });
  const timeStr = format(new Date(event.startTime), 'hh:mm a', { locale });
  const eventTypeLabel = getEventTypeLabel(event.type, t);
  const heroImage = pet?.profilePhoto || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1327&q=80";

  return (
    <View style={[styles.container, { backgroundColor: COLORS.backgroundDark }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: COLORS.blackOp20 }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={[styles.iconButton, { backgroundColor: COLORS.blackOp20 }]}>
            <MaterialIcons name="share" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: COLORS.blackOp20 }]}>
            <MaterialIcons name="more-vert" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: heroImage }}
            style={styles.heroImage}
            contentFit="cover"
            transition={500}
          />
          <LinearGradient
            colors={[COLORS.backgroundDark, 'rgba(16,34,16,0.6)', 'transparent']}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <View style={[styles.badge, { borderColor: COLORS.primary }]}>
              <Text style={[styles.badgeText, { color: COLORS.primary }]}>{eventTypeLabel}</Text>
            </View>
            <Text style={[styles.heroTitle, { color: COLORS.white }]}>{event.title}</Text>
            <Text style={[styles.heroSubtitle, { color: COLORS.gray300 }]}>{event.description || t('events.eventDetails')}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.grid}>
            <View style={[styles.card, { backgroundColor: COLORS.surfaceDark, width: (width - 32 - 12) / 2 }]}>
              <View style={styles.cardIconContainer}>
                <MaterialIcons name="calendar-today" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.cardLabel, { color: COLORS.gray400 }]}>{t('events.date')}</Text>
                <Text style={[styles.cardValue, { color: COLORS.white }]}>{dateStr}</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: COLORS.surfaceDark, width: (width - 32 - 12) / 2 }]}>
              <View style={styles.cardIconContainer}>
                <MaterialIcons name="schedule" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.cardLabel, { color: COLORS.gray400 }]}>{t('events.time')}</Text>
                <Text style={[styles.cardValue, { color: COLORS.white }]}>{timeStr}</Text>
              </View>
            </View>

            {pet && (
              <View style={[styles.card, { backgroundColor: COLORS.surfaceDark, width: (width - 32 - 12) / 2 }]}>
                <View style={[styles.cardIconContainer, styles.petAvatarContainer, { borderColor: COLORS.primary }]}>
                  <Image source={{ uri: pet.profilePhoto }} style={styles.petAvatar} />
                </View>
                <View>
                  <Text style={[styles.cardLabel, { color: COLORS.gray400 }]}>{t('events.pet')}</Text>
                  <Text style={[styles.cardValue, { color: COLORS.white }]} numberOfLines={1}>{pet.name}</Text>
                </View>
              </View>
            )}

            <View style={[styles.card, { backgroundColor: COLORS.surfaceDark, width: (width - 32 - 12) / 2 }]}>
              <View style={styles.cardIconContainer}>
                <MaterialIcons name="location-on" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.cardLabel, { color: COLORS.gray400 }]}>{t('events.location')}</Text>
                <Text style={[styles.cardValue, { color: COLORS.white }]} numberOfLines={1}>{event.location || t('events.noLocation')}</Text>
              </View>
            </View>
          </View>

          {event.notes && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: COLORS.white }]}>{t('events.notes')}</Text>
              <View style={[styles.notesBox, { backgroundColor: COLORS.surfaceDark }]}>
                <Text style={[styles.notesText, { color: COLORS.gray300 }]}>{event.notes}</Text>
              </View>
            </View>
          )}

          {event.reminder && (
            <View style={styles.section}>
              <View style={[styles.reminderCard, { backgroundColor: COLORS.surfaceDark }]}>
                <View style={styles.reminderLeft}>
                  <View style={styles.reminderIconBox}>
                    <MaterialIcons name="notifications-active" size={24} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={[styles.reminderTitle, { color: COLORS.white }]}>{t('events.reminder')}</Text>
                    <Text style={[styles.reminderSubtitle, { color: COLORS.gray400 }]}>{t('events.reminderEnabled')}</Text>
                  </View>
                </View>
                <Switch
                  value={eventStatus !== 'cancelled'}
                  onValueChange={async (enabled) => {
                    if (!event) return;
                    if (enabled) {
                      await scheduleChainForEvent(event);
                      resetStatus(event._id);
                      setEventStatus('upcoming');
                    } else {
                      await cancelRemindersForEvent(event._id);
                      markCancelled(event._id);
                      setEventStatus('cancelled');
                    }
                  }}
                  trackColor={{ false: '#767577', true: COLORS.primary }}
                  thumbColor={'#f4f3f4'}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10, backgroundColor: COLORS.surfaceDarker }]}>
        <View style={styles.footerGrid}>
          <TouchableOpacity onPress={handleEdit} style={styles.footerIconButton}>
            <MaterialIcons name="edit" size={24} color={COLORS.gray400} />
            <Text style={[styles.footerIconText, { color: COLORS.gray400 }]}>{t('common.edit')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleDelete} style={styles.footerIconButton}>
            <MaterialIcons name="delete" size={24} color={COLORS.gray400} />
            <Text style={[styles.footerIconText, { color: COLORS.gray400 }]}>{t('common.delete')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDuplicate}
            style={[styles.addToCalendarButton, { backgroundColor: COLORS.primary, shadowColor: COLORS.primary }]}
          >
            <MaterialIcons name="content-copy" size={20} color="black" />
            <Text style={styles.addToCalendarText}>{t('events.duplicate')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    height: 320,
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
    top: 0,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 32,
  },
  badge: {
    backgroundColor: 'rgba(19, 236, 19, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -16,
    zIndex: 10,
    gap: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  petAvatarContainer: {
    overflow: 'hidden',
    borderWidth: 2,
    padding: 0,
  },
  petAvatar: {
    width: '100%',
    height: '100%',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  notesBox: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    paddingRight: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reminderIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 236, 19, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reminderSubtitle: {
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    zIndex: 30,
  },
  footerGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  footerIconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
  },
  footerIconText: {
    fontSize: 10,
    fontWeight: '500',
  },
  addToCalendarButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCalendarText: {
    color: 'black',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonSecondary: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
});
