import * as Localization from 'expo-localization';

const FALLBACK_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Istanbul',
  'Europe/Athens',
  'Europe/Warsaw',
  'Europe/Bucharest',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Prague',
  'Europe/Budapest',
  'Europe/Zurich',
  'Europe/Stockholm',
  'Europe/Oslo',
  'Europe/Copenhagen',
  'Europe/Helsinki',
  'Europe/Dublin',
  'Europe/Lisbon',
  'Europe/Kiev',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Jerusalem',
  'Asia/Tehran',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Taipei',
  'Asia/Manila',
  'Asia/Kuala_Lumpur',
  'Asia/Ho_Chi_Minh',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Sydney',
  'Australia/Brisbane',
  'Pacific/Auckland',
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
] as const;

export const detectDeviceTimezone = (): string => {
  try {
    const calendars = Localization.getCalendars();
    if (calendars.length > 0 && calendars[0].timeZone) {
      const fromCalendar = normalizeTimezone(calendars[0].timeZone);
      if (fromCalendar) {
        return fromCalendar;
      }
    }
  } catch {
    // noop
  }

  try {
    return normalizeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

export const normalizeTimezone = (timezone?: string | null): string | undefined => {
  const trimmed = timezone?.trim();
  if (!trimmed) {
    return undefined;
  }

  return isValidTimezone(trimmed) ? trimmed : undefined;
};

export const resolveEffectiveTimezone = (timezone?: string | null): string => {
  return normalizeTimezone(timezone) ?? detectDeviceTimezone();
};

export const getSupportedTimezones = (): string[] => {
  try {
    const withSupportedValues = Intl as typeof Intl & {
      supportedValuesOf?: (key: 'timeZone') => string[];
    };

    if (typeof withSupportedValues.supportedValuesOf === 'function') {
      const values = withSupportedValues.supportedValuesOf('timeZone');
      if (values.length > 0) {
        return values.includes('UTC') ? values : ['UTC', ...values];
      }
    }
  } catch {
    // noop
  }

  return [...FALLBACK_TIMEZONES];
};

export const formatTimezoneLabel = (timezone: string): string => {
  if (!timezone) {
    return 'UTC';
  }

  return timezone
    .split('/')
    .map((part) => part.replace(/_/g, ' '))
    .join(' / ');
};
