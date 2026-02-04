import i18n from '@/lib/i18n';
import { addDays, addHours, endOfDay, format, formatDistanceToNow, isAfter, isToday, isTomorrow, isYesterday, startOfDay, isSameDay } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { formatInTimeZone as fnsFormatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { TranslationFunction } from '../types';
import { fromUTCWithOffset } from './dateConversion';

// Re-export ISO 8601 conversion utilities
export * from './dateConversion';

const getLocale = () => {
  return i18n.language === 'tr' ? tr : enUS;
};

export const formatDate = (date: Date | string | number, formatStr: string = 'dd MMMM yyyy') => {
  // Ensure we handle UTC dates properly for display
  let dateObj: Date;

  if (typeof date === 'string' && date.includes('T')) {
    // If it's an ISO string, convert properly to local time
    dateObj = fromUTCWithOffset(date);
  } else {
    dateObj = new Date(date);
  }

  return format(dateObj, formatStr, { locale: getLocale() });
};

export const formatTime = (date: Date | string | number) => {
  // Ensure we handle UTC dates properly for display
  let dateObj: Date;

  if (typeof date === 'string' && date.includes('T')) {
    // If it's an ISO string, convert properly to local time
    dateObj = fromUTCWithOffset(date);
  } else {
    dateObj = new Date(date);
  }

  return format(dateObj, 'HH:mm', { locale: getLocale() });
};

export const getRelativeTime = (date: Date | string | number) => {
  // Ensure we handle UTC dates properly for relative time
  let dateObj: Date;

  if (typeof date === 'string' && date.includes('T')) {
    // If it's an ISO string, convert properly to local time
    dateObj = fromUTCWithOffset(date);
  } else {
    dateObj = new Date(date);
  }

  return formatDistanceToNow(dateObj, { addSuffix: true, locale: getLocale() });
};

export const formatEventDate = (date: Date | string | number, t: TranslationFunction) => {
  // Ensure we handle UTC dates properly for event date
  let dateObj: Date;

  if (typeof date === 'string' && date.includes('T')) {
    // If it's an ISO string, convert properly to local time
    dateObj = fromUTCWithOffset(date);
  } else {
    dateObj = new Date(date);
  }

  if (isToday(dateObj)) {
    return t('eventCard.today');
  } else if (isTomorrow(dateObj)) {
    return t('eventCard.tomorrow');
  } else if (isYesterday(dateObj)) {
    return t('eventCard.yesterday');
  } else {
    return format(dateObj, 'dd MMMM yyyy', { locale: getLocale() });
  }
};

/**
 * Format a date in a specific timezone
 */
export const formatInTimeZone = (
  date: Date | string | number,
  timezone: string,
  formatStr: string,
  options?: { locale?: any }
) => {
  return fnsFormatInTimeZone(new Date(date), timezone, formatStr, {
    locale: options?.locale || getLocale(),
  });
};

/**
 * Check if a date is "today" in the given timezone
 */
export const isTodayInTimeZone = (date: Date | string | number, timezone: string) => {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const zonedDate = toZonedTime(new Date(date), timezone);
  return isSameDay(zonedNow, zonedDate);
};

/**
 * Check if a date is "tomorrow" in the given timezone
 */
export const isTomorrowInTimeZone = (date: Date | string | number, timezone: string) => {
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);
  const zonedDate = toZonedTime(new Date(date), timezone);
  
  const tomorrow = addDays(zonedNow, 1);
  return isSameDay(tomorrow, zonedDate);
};

/**
 * Get the end of the day for a specific date in a timezone, returned as UTC Date
 */
export const getEndOfDayInTimeZone = (date: Date, timezone: string) => {
  const zonedDate = toZonedTime(date, timezone);
  const endOfDayZoned = endOfDay(zonedDate);
  return fromZonedTime(endOfDayZoned, timezone);
};

export const dateUtils = {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  isAfter,
  addHours,
  startOfDay,
  endOfDay,
  addDays,
  getLocale,
  toZonedTime,
  fromZonedTime,
  formatInTimeZone,
  isTodayInTimeZone,
  isTomorrowInTimeZone,
  getEndOfDayInTimeZone
};
