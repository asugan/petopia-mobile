import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ReactNativeDateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Text as PaperText, } from '@/components/ui';
import { useTheme } from '@/lib/theme';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'datetime' | 'time';
  label?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  error?: boolean;
  errorText?: string;
}

export function DateTimePicker({
  value,
  onChange,
  mode = 'date',
  label,
  minimumDate,
  maximumDate,
  disabled = false,
  error = false,
  errorText,
}: DateTimePickerProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const { theme } = useTheme();

  const showPicker = () => {
    if (!disabled) {
      setPickerVisible(true);
    }
  };

  const hidePicker = () => {
    setPickerVisible(false);
  };

  const handleConfirm = (date: Date) => {
    onChange(date);
    if (Platform.OS !== 'ios') {
      hidePicker();
    }
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      setPickerVisible(true); // Keep picker open on iOS
    }

    if (event.type === 'dismissed' || (event.type === 'set' && selectedDate)) {
      if (selectedDate) {
        handleConfirm(selectedDate);
      }
      if (Platform.OS !== 'ios') {
        hidePicker();
      }
    }

  };

  const formatDate = (date: Date) => {
    if (mode === 'time') {
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (mode === 'datetime') {
      return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  // iOS: use compact display which handles its own button UI
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={[
            styles.label,
            { color: error ? theme.colors.error : theme.colors.onSurface }
          ]}>
            {label}
          </Text>
        )}

        <View
          style={[
            styles.iosCompactContainer,
            {
              borderColor: error
                ? theme.colors.error
                : theme.colors.outline,
              backgroundColor: disabled
                ? theme.colors.surfaceDisabled
                : theme.colors.surface,
            }
          ]}
        >
          <ReactNativeDateTimePicker
            mode={mode}
            display="compact"
            value={value}
            onChange={handlePickerChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            disabled={disabled}
          />
        </View>

        {error && errorText && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errorText}
          </Text>
        )}
      </View>
    );
  }

  // Android: use TouchableOpacity with native picker dialog
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[
          styles.label,
          { color: error ? theme.colors.error : theme.colors.onSurface }
        ]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        onPress={showPicker}
        disabled={disabled}
        style={[
          styles.datePicker,
          {
            borderColor: error
              ? theme.colors.error
              : theme.colors.outline,
            backgroundColor: disabled
              ? theme.colors.surfaceDisabled
              : theme.colors.surface,
          }
        ]}
      >
        <PaperText style={[
          styles.dateText,
          {
            color: value
              ? theme.colors.onSurface
              : theme.colors.onSurfaceVariant,
          }
        ]}>
          {formatDate(value)}
        </PaperText>
      </TouchableOpacity>

      {error && errorText && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {errorText}
        </Text>
      )}

      {isPickerVisible && (
        <ReactNativeDateTimePicker
          mode={mode}
          value={value}
          onChange={handlePickerChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  iosCompactContainer: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    justifyContent: 'center',
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
