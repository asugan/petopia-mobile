import { Text as PaperText, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { fromUTCWithOffset, parseISODate, toISODateString, toTimeString, toUTCWithOffset } from '@/lib/utils/dateConversion';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

type OutputFormat = 'iso' | 'iso-date' | 'iso-time' | 'date-object' | 'yyyy-mm-dd';

type FieldOnChange = (value: unknown) => void;

type DateTimeMode = 'date' | 'time';

interface SmartDatePickerProps {
  name: string;
  label?: string;
  mode?: 'date' | 'datetime' | 'time';
  outputFormat?: OutputFormat;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  testID?: string;
  required?: boolean;
}

export const SmartDatePicker = ({
  name,
  label,
  mode = 'date',
  outputFormat = 'iso',
  minimumDate,
  maximumDate,
  disabled = false,
  testID,
  required = false,
}: SmartDatePickerProps) => {
  const { control } = useFormContext();
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const [isPickerVisible, setPickerVisible] = useState(false);

  const dateLocale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
  const iosLocale = i18n.language === 'tr' ? 'tr_TR' : 'en_US';

  // Parse time string (HH:MM) to Date object
  const parseTimeStringToDate = (timeStr: string): Date | null => {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const date = new Date();
    date.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
    return date;
  };

  // Get Date object from stored value for display and picker
  const getDisplayDate = (val: unknown): Date => {
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      // Handle time-only format (HH:MM)
      if (outputFormat === 'iso-time' || /^\d{1,2}:\d{2}$/.test(val)) {
        return parseTimeStringToDate(val) ?? new Date();
      }
      // Handle simple date format (YYYY-MM-DD)
      if (outputFormat === 'yyyy-mm-dd' || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return parseISODate(val) ?? new Date();
      }
      // Handle ISO date/datetime format - convert from UTC to local
      if (val.includes('T')) {
        return fromUTCWithOffset(val);
      }
      return parseISODate(val) ?? new Date();
    }
    return new Date();
  };

  // Convert selected date to the desired output format
  const convertToOutputFormat = (date: Date): Date | string => {
    switch (outputFormat) {
      case 'iso':
        return toUTCWithOffset(date);
      case 'iso-date':
        return toISODateString(date)!;
      case 'yyyy-mm-dd':
        return toISODateString(date)!;
      case 'iso-time':
        return toTimeString(date) ?? date.toISOString().split('T')[1].slice(0, 5);
      case 'date-object':
        return date;
      default:
        return toUTCWithOffset(date);
    }
  };

  const hidePicker = () => {
    setPickerVisible(false);
  };

  const formatDate = (date: Date) => {
    if (mode === 'time') {
      return date.toLocaleTimeString(dateLocale, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (mode === 'datetime') {
      return date.toLocaleString(dateLocale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString(dateLocale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const handlePickerChange = (onChange: FieldOnChange) => (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      hidePicker();
      return;
    }

    if (event.type === 'set' && selectedDate) {
      const outputValue = convertToOutputFormat(selectedDate);
      onChange(outputValue);

      if (Platform.OS !== 'ios') {
        hidePicker();
      }
    }
  };

  const openAndroidDateTimePicker = (currentValue: unknown, onChange: FieldOnChange) => {
    const baseValue = currentValue ? getDisplayDate(currentValue) : new Date();

    const openPicker = (pickerMode: DateTimeMode, value: Date, onConfirm: (date: Date) => void) => {
      DateTimePickerAndroid.open({
        mode: pickerMode,
        value,
        minimumDate: pickerMode === 'date' ? minimumDate : undefined,
        maximumDate: pickerMode === 'date' ? maximumDate : undefined,
        onChange: (event, selectedDate) => {
          if (event.type !== 'set' || !selectedDate) return;
          onConfirm(selectedDate);
        },
      });
    };

    openPicker('date', baseValue, (dateOnly) => {
      const dateWithDefaultTime = new Date(dateOnly);
      dateWithDefaultTime.setHours(
        currentValue ? baseValue.getHours() : 0,
        currentValue ? baseValue.getMinutes() : 0,
        0,
        0
      );

      onChange(convertToOutputFormat(dateWithDefaultTime));

      openPicker('time', dateWithDefaultTime, (selectedTime) => {
        const finalDateTime = new Date(dateWithDefaultTime);
        finalDateTime.setHours(
          selectedTime.getHours(),
          selectedTime.getMinutes(),
          selectedTime.getSeconds(),
          selectedTime.getMilliseconds()
        );

        onChange(convertToOutputFormat(finalDateTime));
      });
    });
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const displayDate = value ? getDisplayDate(value) : undefined;

        const showPicker = () => {
          if (disabled) return;

          if (Platform.OS === 'android' && mode === 'datetime') {
            openAndroidDateTimePicker(value, onChange);
            return;
          }

          setPickerVisible(true);
        };

        return (
          <View style={styles.container}>
            {label && (
              <Text
                style={[
                  styles.label,
                  { color: error ? theme.colors.error : theme.colors.onSurface },
                ]}
              >
                {label}
                {required && ' *'}
              </Text>
            )}

            <TouchableOpacity
              onPress={showPicker}
              disabled={disabled}
              style={[
                styles.datePicker,
                {
                  borderColor: error ? theme.colors.error : theme.colors.outline,
                  backgroundColor: disabled
                    ? theme.colors.surfaceDisabled
                    : theme.colors.surface,
                },
              ]}
              testID={testID}
            >
              <PaperText
                style={[
                  styles.dateText,
                  {
                    color: value
                      ? theme.colors.onSurface
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {displayDate ? formatDate(displayDate) : ''}
              </PaperText>
            </TouchableOpacity>

            {error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}
              >
                {error.message}
              </Text>
            )}

            {isPickerVisible && !(Platform.OS === 'android' && mode === 'datetime') && (
              <DateTimePicker
                mode={mode}
                value={displayDate ?? new Date()}
                onChange={handlePickerChange(onChange)}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale={Platform.OS === 'ios' ? iosLocale : undefined}
                onError={(pickerError) => {
                  if (Platform.OS === 'android' && pickerError) {
                    console.error('DateTimePicker error:', pickerError);
                  }
                }}
              />
            )}
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  datePicker: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    minHeight: 56,
  },
  dateText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
