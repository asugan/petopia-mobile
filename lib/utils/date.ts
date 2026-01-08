import i18n from '@/lib/i18n';
import { addDays, addHours, endOfDay, format, formatDistanceToNow, isAfter, isToday, isTomorrow, isYesterday, startOfDay } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
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
  getLocale
};
