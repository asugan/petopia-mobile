import { Event, FeedingSchedule } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export interface NextActivity {
  label: string;
  time: string;
  date: Date;
  color: string;
  priority: number;
  type: 'vaccination' | 'medication' | 'vet' | 'feeding' | 'event';
  originalData?: Event | FeedingSchedule;
}

export interface ActivityCalculationParams {
  events: Event[];
  feedingSchedules: FeedingSchedule[];
  locale?: string;
}

/**
 * Calculate the priority score for an activity type
 * Lower numbers indicate higher priority (1 = highest priority)
 */
export const calculateActivityPriority = (activityType: NextActivity['type']): number => {
  switch (activityType) {
    case 'vaccination':
    case 'medication':
      return 1; // Highest priority - health critical
    case 'vet':
      return 2; // High priority - health important
    case 'feeding':
      return 3; // Medium priority - routine care
    case 'event':
      return 4; // Lowest priority - general activities
    default:
      return 5;
  }
};

/**
 * Format activity time based on locale and proximity to current time
 * Simplified and more robust to avoid invalid date errors
 */
export const formatActivityTime = (time: Date, locale: string = 'en'): string => {
  // Validate input date first
  if (!time || isNaN(time.getTime())) {
    return '';
  }

  const dateLocale = locale === 'tr' ? tr : enUS;
  const now = new Date();

  // If the activity is within the next 24 hours, show relative time
  const hoursDiff = time.getTime() - now.getTime();
  const hoursAbs = Math.abs(hoursDiff);

  if (hoursAbs <= 24 * 60 * 60 * 1000) { // Within 24 hours
    try {
      return formatDistanceToNow(time, {
        addSuffix: true,
        locale: dateLocale
      });
    } catch (error) {
      return time.toLocaleTimeString(dateLocale === enUS ? 'en-US' : 'tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  // Otherwise show absolute time
  try {
    return format(time, 'MMM d, HH:mm', {
      locale: dateLocale
    });
  } catch (error) {
    // Fallback to native date formatting
    return time.toLocaleDateString(dateLocale === enUS ? 'en-US' : 'tr-TR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

/**
 * Get the next activity for a pet based on all available data
 */
export const getNextActivityForPet = ({
  events,
  feedingSchedules,
  locale = 'en'
}: ActivityCalculationParams): NextActivity | null => {
  const now = new Date();
  const activities: NextActivity[] = [];

  // Process events (vet appointments and other events)
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.startTime);
      // Validate the date is valid and in the future
      return !isNaN(eventDate.getTime()) && eventDate >= now;
    })
    .map(event => {
      const eventDate = new Date(event.startTime);
      const isVetAppointment = event.type === 'vet_visit';
      const isVaccination = event.type === 'vaccination';
      const isMedication = event.type === 'medication';

      const activityType: NextActivity['type'] = isVaccination
        ? 'vaccination'
        : isMedication
          ? 'medication'
          : isVetAppointment
            ? 'vet'
            : 'event';

      return {
        type: activityType,
        label: isVaccination
          ? (event.vaccineName || event.title)
          : isMedication
            ? (event.medicationName || event.title)
            : event.title,
        time: formatActivityTime(eventDate, locale),
        date: eventDate,
        priority: calculateActivityPriority(activityType),
        color: isVaccination
          ? '#FF6B35'
          : isMedication
            ? '#F7931E'
            : isVetAppointment
              ? '#9C27B0'
              : '#2196F3',
        originalData: event
      } as NextActivity;
    })
    .filter(activity => activity.time !== ''); // Remove activities with invalid time formatting

  activities.push(...upcomingEvents);

  // Process feeding schedules
  const activeFeedingSchedules = feedingSchedules
    .filter(schedule => schedule.isActive);

  if (activeFeedingSchedules.length > 0) {
    // Calculate next feeding times for each active schedule
    const nextFeedings = activeFeedingSchedules
      .map(schedule => {
        // Get the next feeding time based on the schedule
        const scheduleTime = new Date(schedule.time);

        // Validate the schedule time is valid
        if (isNaN(scheduleTime.getTime())) {
          return null;
        }

        let nextFeedingTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          scheduleTime.getHours(),
          scheduleTime.getMinutes()
        );

        // If the time has passed today, schedule for tomorrow
        if (nextFeedingTime <= now) {
          nextFeedingTime = new Date(nextFeedingTime.getTime() + 24 * 60 * 60 * 1000);
        }

        return {
          schedule,
          nextTime: nextFeedingTime
        };
      })
      .filter((feeding): feeding is { schedule: FeedingSchedule; nextTime: Date } => feeding !== null); // Remove invalid feeding schedules

    if (nextFeedings.length > 0) {
      // Find the soonest feeding time
      const soonestFeeding = nextFeedings.reduce((soonest, current) =>
        current.nextTime < soonest.nextTime ? current : soonest
      );

      const feedingTime = formatActivityTime(soonestFeeding.nextTime, locale);
      if (feedingTime !== '') { // Only add if time formatting is valid
        activities.push({
          type: 'feeding',
          label: 'Feeding',
          time: feedingTime,
          date: soonestFeeding.nextTime,
          priority: calculateActivityPriority('feeding'),
          color: '#4CAF50', // Green for feeding
          originalData: soonestFeeding.schedule
        } as NextActivity);
      }
    }
  }

  // Sort by date (ascending) primarily, then by priority for ties
  activities.sort((a, b) => {
    const timeDiff = a.date.getTime() - b.date.getTime();
    
    // If times are essentially the same (within a minute), prioritize important activities
    if (Math.abs(timeDiff) < 60000) {
       return a.priority - b.priority;
    }
    
    return timeDiff;
  });

  return activities.length > 0 ? activities[0] : null;
};
