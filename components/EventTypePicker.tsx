import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Chip, Text } from '@/components/ui';
import { EVENT_TYPES } from '@/constants';
import { getEventTypeIcon, getEventTypeLabel } from '@/constants/eventIcons';
import { useTheme } from '@/lib/theme';
import { getReadableTextColor } from '@/lib/utils/colorContrast';
import { getEventColor } from '@/lib/utils/eventColors';

interface EventTypePickerProps {
  selectedType?: string | null;
  onSelect: (type: string) => void;
  label?: string;
  error?: string;
  testID?: string;
}

const EventTypePicker: React.FC<EventTypePickerProps> = ({
  selectedType,
  onSelect,
  label,
  error,
  testID,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const eventTypes = Object.values(EVENT_TYPES);

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      )}
      <View style={styles.chipContainer} testID={testID}>
        {eventTypes.map((type) => {
          const isSelected = selectedType === type;
          const eventColor = getEventColor(type, theme);
          const selectedTextColor = getReadableTextColor(
            eventColor,
            theme.colors.onPrimary,
            theme.colors.onSurface
          );
          const iconColor = isSelected ? selectedTextColor : theme.colors.onSurface;

          return (
            <Chip
              key={type}
              selected={isSelected}
              onPress={() => onSelect(type)}
              style={[
                styles.chip,
                isSelected && { backgroundColor: eventColor },
              ]}
              icon={({ size }) => (
                <MaterialCommunityIcons
                  name={getEventTypeIcon(type) as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={size}
                  color={iconColor}
                />
              )}
              textStyle={{ color: iconColor }}
              mode={isSelected ? 'flat' : 'outlined'}
            >
              {getEventTypeLabel(type, t)}
            </Chip>
          );
        })}
      </View>
      {error && (
        <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    marginRight: 0,
    marginBottom: 8,
  },
  error: {
    marginTop: 4,
    marginLeft: 4,
  },
});

export default EventTypePicker;
