import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { createDayOfWeekOptions } from '@/constants/recurrence';

interface DayOfWeekPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
  testID?: string;
}

export function DayOfWeekPicker({
  value,
  onChange,
  disabled = false,
  testID,
}: DayOfWeekPickerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const dayOptions = React.useMemo(() => createDayOfWeekOptions((key, defaultValue) => t(key, defaultValue ?? key)), [t]);

  const toggleDay = (day: number) => {
    if (disabled) return;

    if (value.includes(day)) {
      // Don't allow deselecting if it's the only selected day
      if (value.length > 1) {
        onChange(value.filter((d) => d !== day));
      }
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.daysRow}>
        {dayOptions.map((day) => {
          const isSelected = value.includes(day.value);
          return (
            <TouchableOpacity
              key={day.value}
              onPress={() => toggleDay(day.value)}
              disabled={disabled}
              style={[
                styles.dayButton,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.outline,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
              testID={testID ? `${testID}-day-${day.value}` : undefined}
            >
              <Text
                variant="labelMedium"
                style={[
                  styles.dayText,
                  {
                    color: isSelected
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  dayText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default DayOfWeekPicker;
