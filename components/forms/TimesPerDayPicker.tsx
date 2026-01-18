import React from 'react';
import { Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { generateDailyTimes } from '@/constants/recurrence';

interface TimesPerDayPickerProps {
  count: number;
  times: string[];
  onCountChange: (count: number) => void;
  onTimesChange: (times: string[]) => void;
  disabled?: boolean;
  testID?: string;
}

export function TimesPerDayPicker({
  count,
  times,
  onCountChange,
  onTimesChange,
  disabled = false,
  testID,
}: TimesPerDayPickerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [tempTime, setTempTime] = React.useState<Date>(new Date());

  const countOptions = [1, 2, 3, 4, 5, 6];

  const handleCountChange = (newCount: number) => {
    if (disabled) return;
    onCountChange(newCount);
    // Auto-generate times for the new count
    const newTimes = generateDailyTimes(newCount);
    onTimesChange(newTimes);
  };

  const handleTimeChange = (index: number, newTime: string) => {
    const updatedTimes = [...times];
    updatedTimes[index] = newTime;
    onTimesChange(updatedTimes);
  };

  // Parse HH:MM string to Date
  const parseTimeToDate = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  };

  // Format Date to HH:MM string
  const formatDateToTime = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const openTimePicker = (index: number) => {
    if (disabled) return;
    const currentTime = times[index] || '09:00';
    setTempTime(parseTimeToDate(currentTime));
    setEditingIndex(index);
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // Android dismisses automatically
      if (event.type === 'set' && selectedDate && editingIndex !== null) {
        handleTimeChange(editingIndex, formatDateToTime(selectedDate));
      }
      setEditingIndex(null);
    } else {
      // iOS - update temp time
      if (selectedDate) {
        setTempTime(selectedDate);
      }
    }
  };

  const handleIOSConfirm = () => {
    if (editingIndex !== null) {
      handleTimeChange(editingIndex, formatDateToTime(tempTime));
    }
    setEditingIndex(null);
  };

  const handleIOSCancel = () => {
    setEditingIndex(null);
  };

  return (
    <View style={styles.container} testID={testID}>
      {/* Count selector */}
      <View style={styles.section}>
        <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurface }]}>
          {t('recurrence.timesPerDay', 'Times per day')}
        </Text>
        <View style={styles.countRow}>
          {countOptions.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => handleCountChange(option)}
              disabled={disabled}
              style={[
                styles.countButton,
                {
                  backgroundColor:
                    count === option
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                  borderColor:
                    count === option
                      ? theme.colors.primary
                      : theme.colors.outline,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
              testID={testID ? `${testID}-count-${option}` : undefined}
            >
              <Text
                variant="labelMedium"
                style={{
                  color:
                    count === option
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant,
                  fontWeight: '600',
                }}
              >
                {option}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time slots */}
      <View style={styles.section}>
        <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurface }]}>
          {t('recurrence.scheduledTimes', 'Scheduled times')}
        </Text>
        <View style={styles.timesGrid}>
          {times.slice(0, count).map((time, index) => (
            <View
              key={index}
              style={[
                styles.timeSlot,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {index + 1}.
              </Text>
              <TouchableOpacity
                onPress={() => openTimePicker(index)}
                disabled={disabled}
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outline,
                  },
                ]}
                testID={testID ? `${testID}-time-${index}` : undefined}
              >
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: '500' }}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Text
          variant="bodySmall"
          style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('recurrence.timesHint', 'Times are automatically distributed throughout the day')}
        </Text>
      </View>

      {/* Android Time Picker (inline) */}
      {Platform.OS === 'android' && editingIndex !== null && (
        <DateTimePicker
          mode="time"
          value={tempTime}
          onChange={handlePickerChange}
          is24Hour={true}
        />
      )}

      {/* iOS Time Picker Modal */}
      {Platform.OS === 'ios' && editingIndex !== null && (
        <Modal
          transparent
          animationType="slide"
          visible={editingIndex !== null}
          onRequestClose={handleIOSCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  {t('forms.timePicker.select', 'Select Time')}
                </Text>
              </View>
              <DateTimePicker
                mode="time"
                value={tempTime}
                onChange={handlePickerChange}
                display="spinner"
                is24Hour={true}
                style={styles.iosPicker}
              />
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={handleIOSCancel}
                  style={styles.modalButton}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  mode="contained"
                  onPress={handleIOSConfirm}
                  style={styles.modalButton}
                >
                  {t('common.confirm', 'Confirm')}
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  label: {
    fontWeight: '500',
  },
  countRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  hint: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  iosPicker: {
    height: 200,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalButton: {
    flex: 1,
  },
});

export default TimesPerDayPicker;
