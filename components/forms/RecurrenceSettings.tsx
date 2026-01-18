import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { SmartSwitch } from './SmartSwitch';
import { SmartDropdown } from './SmartDropdown';
import { SmartDatePicker } from './SmartDatePicker';
import { DayOfWeekPicker } from './DayOfWeekPicker';
import { TimesPerDayPicker } from './TimesPerDayPicker';
import { FormSection } from './FormSection';
import {
  RECURRENCE_FREQUENCIES,
  createFrequencyOptions,
  generateDailyTimes,
  getUserTimezone,
} from '@/constants/recurrence';
import type { RecurrenceFrequency } from '@/constants/recurrence';

interface RecurrenceSettingsProps {
  disabled?: boolean;
  testID?: string;
}

export function RecurrenceSettings({
  disabled = false,
  testID,
}: RecurrenceSettingsProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { control, setValue, getValues } = useFormContext();

  // Watch recurrence-related fields
  const isRecurring = useWatch({ control, name: 'isRecurring' });
  const frequency = useWatch({ control, name: 'recurrence.frequency' }) as RecurrenceFrequency | undefined;
  const daysOfWeek = useWatch({ control, name: 'recurrence.daysOfWeek' }) as number[] | undefined;
  const timesPerDay = useWatch({ control, name: 'recurrence.timesPerDay' }) as number | undefined;
  const dailyTimes = useWatch({ control, name: 'recurrence.dailyTimes' }) as string[] | undefined;

  // Initialize timezone on mount
  React.useEffect(() => {
    const currentTimezone = getValues('recurrence.timezone');
    if (!currentTimezone) {
      setValue('recurrence.timezone', getUserTimezone());
    }
  }, [getValues, setValue]);

  // Frequency options
  const frequencyOptions = React.useMemo(
    () => createFrequencyOptions((key, defaultValue) => t(key, defaultValue ?? key)),
    [t]
  );

  // React to frequency changes and set sensible defaults
  React.useEffect(() => {
    if (!frequency) return;

    switch (frequency) {
      case 'weekly':
        if (!daysOfWeek || daysOfWeek.length === 0) {
          setValue('recurrence.daysOfWeek', [1]); // Monday
        }
        break;
      case 'monthly':
        setValue('recurrence.dayOfMonth', new Date().getDate());
        break;
      case 'times_per_day':
        if (!timesPerDay) {
          setValue('recurrence.timesPerDay', 2);
          setValue('recurrence.dailyTimes', generateDailyTimes(2));
        }
        break;
      case 'custom':
        setValue('recurrence.interval', 2);
        break;
    }
  }, [frequency, daysOfWeek, timesPerDay, setValue]);

  // Handle days of week change
  const handleDaysOfWeekChange = (days: number[]) => {
    setValue('recurrence.daysOfWeek', days);
  };

  // Handle times per day change
  const handleTimesPerDayChange = (count: number) => {
    setValue('recurrence.timesPerDay', count);
  };

  // Handle daily times change
  const handleDailyTimesChange = (times: string[]) => {
    setValue('recurrence.dailyTimes', times);
  };

  if (!isRecurring) {
    return (
      <View style={styles.switchContainer} testID={testID}>
        <SmartSwitch
          name="isRecurring"
          label={t('recurrence.enableRecurring', 'Repeat this event')}
          description={t('recurrence.enableRecurringDesc', 'Create recurring events automatically')}
          disabled={disabled}
          testID={`${testID}-switch`}
        />
      </View>
    );
  }

  return (
    <FormSection title={t('recurrence.settings', 'Repeat Settings')}>
      {/* Enable/Disable Switch */}
      <SmartSwitch
        name="isRecurring"
        label={t('recurrence.enableRecurring', 'Repeat this event')}
        description={t('recurrence.enableRecurringDesc', 'Create recurring events automatically')}
        disabled={disabled}
        testID={`${testID}-switch`}
      />

      {/* Frequency Selector */}
      <View style={styles.fieldContainer}>
        <SmartDropdown
          name="recurrence.frequency"
          label={t('recurrence.frequency', 'Repeat frequency')}
          options={frequencyOptions}
          placeholder={t('recurrence.selectFrequency', 'Select frequency')}
          disabled={disabled}
          testID={`${testID}-frequency`}
        />
      </View>

      {/* Weekly: Day of Week Picker */}
      {frequency === RECURRENCE_FREQUENCIES.WEEKLY && (
        <View style={styles.fieldContainer}>
          <Text
            variant="labelMedium"
            style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
          >
            {t('recurrence.repeatOn', 'Repeat on')}
          </Text>
          <DayOfWeekPicker
            value={daysOfWeek || [1]}
            onChange={handleDaysOfWeekChange}
            disabled={disabled}
            testID={`${testID}-days`}
          />
        </View>
      )}

      {/* Monthly: Day of Month */}
      {frequency === RECURRENCE_FREQUENCIES.MONTHLY && (
        <View style={styles.fieldContainer}>
          <SmartDropdown
            name="recurrence.dayOfMonth"
            label={t('recurrence.dayOfMonth', 'Day of month')}
            options={Array.from({ length: 31 }, (_, i) => ({
              value: String(i + 1),
              label: String(i + 1),
            }))}
            placeholder={t('recurrence.selectDay', 'Select day')}
            disabled={disabled}
            testID={`${testID}-dayOfMonth`}
          />
        </View>
      )}

      {/* Custom: Interval */}
      {frequency === RECURRENCE_FREQUENCIES.CUSTOM && (
        <View style={styles.fieldContainer}>
          <SmartDropdown
            name="recurrence.interval"
            label={t('recurrence.repeatEvery', 'Repeat every')}
            options={Array.from({ length: 30 }, (_, i) => ({
              value: String(i + 1),
              label: t('recurrence.everyXDays', { count: i + 1, defaultValue: `${i + 1} days` }),
            }))}
            placeholder={t('recurrence.selectInterval', 'Select interval')}
            disabled={disabled}
            testID={`${testID}-interval`}
          />
        </View>
      )}

      {/* Times Per Day */}
      {frequency === RECURRENCE_FREQUENCIES.TIMES_PER_DAY && (
        <View style={styles.fieldContainer}>
          <TimesPerDayPicker
            count={timesPerDay || 2}
            times={dailyTimes || generateDailyTimes(timesPerDay || 2)}
            onCountChange={handleTimesPerDayChange}
            onTimesChange={handleDailyTimesChange}
            disabled={disabled}
            testID={`${testID}-timesPerDay`}
          />
        </View>
      )}

      {/* End Date (Optional) */}
      <View style={styles.fieldContainer}>
        <SmartDatePicker
          name="recurrence.endDate"
          label={t('recurrence.endDate', 'End date (optional)')}
          mode="date"
          minimumDate={new Date()}
          outputFormat="iso-date"
          testID={`${testID}-endDate`}
        />
        <Text
          variant="bodySmall"
          style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('recurrence.endDateHint', 'Leave empty for indefinite repeating')}
        </Text>
      </View>

      {/* Timezone Info */}
      <View style={[styles.infoBox, { backgroundColor: theme.colors.secondaryContainer }]}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
          🌍 {t('recurrence.timezoneInfo', 'Events will be created in your timezone')}: {getUserTimezone()}
        </Text>
      </View>
    </FormSection>
  );
}

const styles = StyleSheet.create({
  switchContainer: {
    marginVertical: 8,
  },
  fieldContainer: {
    marginTop: 12,
  },
  fieldLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  hint: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
});

export default RecurrenceSettings;
