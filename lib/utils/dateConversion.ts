/**
 * Centralized date conversion utilities for consistent ISO 8601 handling
 * between the mobile app and backend API
 *
 * All dates are stored in UTC with proper timezone metadata to ensure
 * consistency across different platforms and timezones.
 */

/**
 * Convert Date object to ISO 8601 string
 * @param date - Date object, null, or undefined
 * @returns ISO 8601 datetime string or undefined if invalid
 */
export function toISOString(date: Date | null | undefined): string | undefined {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

/**
 * Convert Date object to ISO 8601 date-only string (YYYY-MM-DD)
 * @param date - Date object, null, or undefined
 * @returns Date-only string in YYYY-MM-DD format or undefined if invalid
 */
export function toISODateString(date: Date | null | undefined): string | undefined {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return undefined;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert Date object to ISO date string (YYYY-MM-DD) with local fallback
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format (never undefined for valid Date)
 */
export function toISODateStringWithFallback(date: Date): string {
  const result = toISODateString(date);
  if (result) return result;

  // Fallback using same local date extraction as toISODateString
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert Date object to time string (HH:MM)
 * @param date - Date object, null, or undefined
 * @returns Time string in HH:MM format or undefined if invalid
 */
export function toTimeString(date: Date | null | undefined): string | undefined {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return undefined;
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Combine separate date and time strings into full ISO 8601 datetime in UTC
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format
 * @returns Full ISO 8601 datetime string in UTC
 * @throws Error if date or time format is invalid
 */
export function combineDateTimeToISO(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) {
    throw new Error('Both date and time are required');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }
  if (!/^\d{2}:\d{2}$/.test(timeStr)) {
    throw new Error('Invalid time format. Expected HH:MM');
  }

  // Create date in local timezone
  const localDate = new Date(`${dateStr}T${timeStr}:00`);
  if (isNaN(localDate.getTime())) {
    throw new Error('Invalid date or time values');
  }

  // Convert to UTC ISO string
  return localDate.toISOString();
}

/**
 * Parse ISO 8601 string to Date object for display purposes
 * @param isoString - ISO 8601 datetime string
 * @returns Date object or null if invalid
 */
export function parseISODate(isoString: string | null | undefined): Date | null {
  if (!isoString) {
    return null;
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * Split ISO datetime string into separate date and time parts
 * @param isoString - ISO 8601 datetime string
 * @returns Object with date (YYYY-MM-DD) and time (HH:MM) or null if invalid
 */
export function splitISODateTime(isoString: string | null | undefined): { date: string; time: string } | null {
  if (!isoString) {
    return null;
  }
  const parts = isoString.slice(0, 16).split('T');
  if (parts.length !== 2) {
    return null;
  }
  return {
    date: parts[0],
    time: parts[1],
  };
}

/**
 * Type guard to check if value is a valid Date
 * @param value - Value to check
 * @returns True if value is a valid Date object
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard to check if string is valid ISO 8601 datetime
 * @param value - Value to check
 * @returns True if value is a valid ISO 8601 datetime string
 */
export function isISODateTimeString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes('T');
}

/**
 * Parse UTC ISO string and return local Date object
 * @param dateString - ISO datetime string (should be in UTC)
 * @returns Date object representing local time equivalent
 * @deprecated Use fromUTCWithOffset(isoString: string, targetOffset?: string) instead
 */
export function fromUTCWithOffsetLegacy(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Convert any date-like value to ISO string
 * Handles Date objects, ISO strings, and timestamps
 * @param value - Date, ISO string, or timestamp
 * @returns ISO 8601 datetime string or undefined if invalid
 */
export function normalizeToISOString(value: Date | string | number | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    // Already a string, validate it's a valid date
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return undefined;
    }
    // If it's already ISO format, return as-is
    if (value.includes('T')) {
      return value;
    }
    // Otherwise convert to full ISO
    return date.toISOString();
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return undefined;
    }
    return date.toISOString();
  }

  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return undefined;
    }
    return value.toISOString();
  }

  return undefined;
}

/**
 * Convert local Date to UTC ISO string with timezone offset metadata
 * @param date - Local Date object
 * @returns ISO 8601 string in UTC with offset info (e.g., "2023-12-08T15:30:00.000Z" or "2023-12-08T15:30:00.000+03:00")
 */
export function toUTCWithOffset(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to toUTCWithOffset');
  }

  // Get the UTC timestamp as ISO string
  const utcISO = date.toISOString();

  // Get the timezone offset in minutes
  const offsetMinutes = date.getTimezoneOffset();
  if (offsetMinutes === 0) {
    // UTC timezone
    return utcISO;
  }

  // For non-UTC, we could include offset info if needed in the future
  // For now, we'll return the standard UTC ISO string since backend expects pure UTC
  return utcISO;
}

/**
 * Parse UTC ISO string to local Date object
 * @param isoString - ISO 8601 string (should be in UTC)
 * @param targetOffset - Optional target timezone offset (e.g., "+03:00")
 * @returns Date object in local timezone
 */
export function fromUTCWithOffset(isoString: string, targetOffset?: string): Date {
  if (!isoString) {
    throw new Error('ISO string is required for fromUTCWithOffset');
  }

  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid ISO string provided to fromUTCWithOffset');
  }

  if (targetOffset) {
    // Parse offset like "+03:00" or "-05:00"
    const match = targetOffset.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) {
      throw new Error('Invalid timezone offset format. Expected ±HH:MM');
    }

    const [, sign, hours, minutes] = match;
    const totalMinutes = (parseInt(hours, 10) * 60 + parseInt(minutes, 10)) * (sign === '+' ? 1 : -1);

    // Calculate the difference between target offset and current offset
    const currentOffset = date.getTimezoneOffset();
    const offsetDiff = totalMinutes + currentOffset;

    return new Date(date.getTime() + (offsetDiff * 60000));
  }

  // Return date as-is (JavaScript will automatically convert to local timezone)
  return date;
}

/**
 * Get current device timezone offset string
 * @returns Timezone offset in ±HH:MM format (e.g., "+03:00", "-05:00")
 */
export function getTimezoneOffset(): string {
  const offset = new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset <= 0 ? '+' : '-';
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Check if a value is a valid UTC ISO date string
 * @param value - Value to check
 * @returns True if valid UTC ISO date string
 */
export function isValidUTCISOString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  // Should end with Z for UTC or be parseable as valid date
  const date = new Date(value);
  return !isNaN(date.getTime());
}
