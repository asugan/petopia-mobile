import { Event } from '../types';
import { dateUtils } from './date';

/**
 * Event group categories for time-based grouping
 */
export type EventGroupKey = 'now' | 'today' | 'tomorrow' | 'thisWeek';

export interface EventGroups {
  now: Event[];
  today: Event[];
  tomorrow: Event[];
  thisWeek: Event[];
}

/**
 * Filters and sorts upcoming events within a specified time range
 *
 * @param events - Array of events to filter
 * @param daysToShow - Number of days to show from now (default: 7)
 * @param maxEvents - Maximum number of events to return (default: 5)
 * @param timezone - User's timezone (optional)
 * @returns Filtered and sorted array of events
 */
export const filterUpcomingEvents = (
  events: Event[],
  daysToShow: number = 7,
  maxEvents: number = 5,
  timezone?: string
): Event[] => {
  const now = new Date();
  
  let endDate: Date;
  if (timezone) {
    const futureDate = dateUtils.addDays(now, daysToShow);
    endDate = dateUtils.getEndOfDayInTimeZone(futureDate, timezone);
  } else {
    endDate = dateUtils.endOfDay(dateUtils.addDays(now, daysToShow));
  }

  return events
    .filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= now && eventDate <= endDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, maxEvents);
};

/**
 * Groups events by time categories (now, today, tomorrow, this week)
 *
 * Events are categorized as:
 * - "now": Events happening within the next hour
 * - "today": Events happening later today (after the next hour)
 * - "tomorrow": Events happening tomorrow
 * - "thisWeek": Events happening in the next 7 days
 *
 * @param events - Array of events to group
 * @param timezone - User's timezone (optional)
 * @returns Object with events grouped by time category
 */
export const groupEventsByTime = (events: Event[], timezone?: string): EventGroups => {
  const now = new Date();
  const inOneHour = dateUtils.addHours(now, 1);

  const groups: EventGroups = {
    now: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
  };

  events.forEach(event => {
    const eventDate = new Date(event.startTime);

    if (dateUtils.isAfter(eventDate, now) && eventDate <= inOneHour) {
      groups.now.push(event);
    } else {
      let isToday, isTomorrow;

      if (timezone) {
        isToday = dateUtils.isTodayInTimeZone(eventDate, timezone);
        isTomorrow = dateUtils.isTomorrowInTimeZone(eventDate, timezone);
      } else {
        isToday = dateUtils.isToday(eventDate);
        isTomorrow = dateUtils.isTomorrow(eventDate);
      }

      if (isToday) {
        groups.today.push(event);
      } else if (isTomorrow) {
        groups.tomorrow.push(event);
      } else {
        groups.thisWeek.push(event);
      }
    }
  });

  return groups;
};

/**
 * Gets the translation key for an event group
 *
 * @param group - Event group key
 * @returns Translation key for the group, or empty string for unknown groups
 */
export const getEventGroupTranslationKey = (group: EventGroupKey | string): string => {
  switch (group) {
    case 'now':
      return 'upcomingEvents.now';
    case 'today':
      return 'upcomingEvents.today';
    case 'tomorrow':
      return 'upcomingEvents.tomorrow';
    case 'thisWeek':
      return 'upcomingEvents.thisWeek';
    default:
      return '';
  }
};
