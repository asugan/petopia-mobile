import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useUserTimezone } from '@/lib/hooks/useUserTimezone';
import { formatInTimeZone } from '@/lib/utils/date';
import { combineDateTimeToISOInTimeZone } from '@/lib/utils/dateConversion';
import { isAfter } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import React, { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SmartDatePicker } from './SmartDatePicker';

interface SmartDateTimePickerProps {
  dateName: string;
  timeName: string;
  combinedOutputName?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  testID?: string;
  minuteInterval?: number;
  mode?: 'past' | 'future';
}

export const SmartDateTimePicker = ({
  dateName,
  timeName,
  combinedOutputName,
  label,
  required = false,
  disabled = false,
  testID,
  minuteInterval = 15,
  mode = 'future',
}: SmartDateTimePickerProps) => {
  const { control, setValue } = useFormContext();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const userTimezone = useUserTimezone();

  // Watch both date and time values
  const dateValue = useWatch({ control, name: dateName });
  const timeValue = useWatch({ control, name: timeName });

  const locale = i18n.language === 'tr' ? tr : enUS;

  // Helper to normalize date value to YYYY-MM-DD format
  const normalizeDateValue = (value: string): string => {
    if (value.includes('T')) {
      // Handle ISO format (backward compatibility)
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid ISO date value');
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Already in YYYY-MM-DD format from yyyy-mm-dd output
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }
    return value;
  };

  // Helper to normalize time value to HH:MM format
  const normalizeTimeValue = (value: string): string => {
    if (value.includes('T')) {
      // Handle ISO format (backward compatibility)
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid ISO time value');
      }
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    // Already in HH:MM format from iso-time output
    if (!/^\d{2}:\d{2}$/.test(value)) {
      throw new Error('Invalid time format. Expected HH:MM');
    }
    return value;
  };

  // Automatically combine date and time into ISO string if combinedOutputName is provided
  useEffect(() => {
    if (combinedOutputName && dateValue && timeValue) {
      try {
        // Normalize values to expected formats
        const normalizedDate = normalizeDateValue(dateValue);
        const normalizedTime = normalizeTimeValue(timeValue);
        const isoDateTime = combineDateTimeToISOInTimeZone(
          normalizedDate,
          normalizedTime,
          userTimezone,
        );
        setValue(combinedOutputName, isoDateTime);
      } catch {
        // Don't set invalid value, just log the error
      }
    }
  }, [dateValue, timeValue, combinedOutputName, setValue, userTimezone]);

  // Combine date and time for validation
  const getCombinedDateTime = () => {
    if (!dateValue || !timeValue) return null;

    try {
      // Use the normalize helpers to ensure proper format
      const normalizedDate = normalizeDateValue(dateValue);
      const normalizedTime = normalizeTimeValue(timeValue);

      const isoDateTime = combineDateTimeToISOInTimeZone(
        normalizedDate,
        normalizedTime,
        userTimezone,
      );
      const date = new Date(isoDateTime);

      // Validate the date
      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch {
      return null;
    }
  };

  const formatDateTimeDisplay = () => {
    if (!dateValue || !timeValue) return '';

    try {
      // Use the normalize helpers to ensure proper format
      const normalizedDate = normalizeDateValue(dateValue);
      const normalizedTime = normalizeTimeValue(timeValue);

      const isoDateTime = combineDateTimeToISOInTimeZone(
        normalizedDate,
        normalizedTime,
        userTimezone,
      );
      const date = new Date(isoDateTime);

      // Validate the date before formatting
      if (isNaN(date.getTime())) {
        return '';
      }

      return formatInTimeZone(date, userTimezone, 'dd MMMM yyyy HH:mm', {
        locale,
      });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>
          {label}
          {required && ' *'}
        </Text>
        {dateValue && timeValue && (
          <Text style={[styles.combinedDisplay, { color: theme.colors.primary }]}>
            {formatDateTimeDisplay()}
          </Text>
        )}
      </View>

      <View style={styles.pickerRow}>
        <View style={styles.pickerContainer}>
          <SmartDatePicker
            name={dateName}
            label={t('forms.dateTimePicker.date')}
            disabled={disabled}
            testID={`${testID}-date`}
            mode="date"
            outputFormat="yyyy-mm-dd"
          />
        </View>

        <View style={styles.pickerContainer}>
          <SmartDatePicker
            name={timeName}
            label={t('forms.dateTimePicker.time')}
            disabled={disabled}
            testID={`${testID}-time`}
            mode="time"
            outputFormat="iso-time"
          />
        </View>
      </View>

      {/* Validation hint */}
      {dateValue && timeValue && (
        <View style={[styles.validationHint, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.hintText, { color: theme.colors.onSurfaceVariant }]}>
            {(() => {
              const combinedDateTime = getCombinedDateTime();
              if (!combinedDateTime) return '';

              const now = new Date();
              const isFuture = isAfter(combinedDateTime, now);

              if (isFuture) {
                const timeDiff = combinedDateTime.getTime() - now.getTime();
                const hoursFromNow = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutesFromNow = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

                if (hoursFromNow === 0) {
                  return t('forms.dateTimePicker.minutesFromNow', { minutes: minutesFromNow });
                } else if (hoursFromNow < 24) {
                  return t('forms.dateTimePicker.hoursFromNow', { hours: hoursFromNow });
                } else {
                  return t('forms.dateTimePicker.daysFromNow', { days: Math.floor(hoursFromNow / 24) });
                }
              } else {
                return t('forms.dateTimePicker.pastDateTimeWarning');
              }
            })()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'System',
  },
  combinedDisplay: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerContainer: {
    flex: 1,
  },
  validationHint: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'System',
  },
});
