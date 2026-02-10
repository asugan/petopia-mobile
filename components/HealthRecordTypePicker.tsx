import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Chip, Text } from '@/components/ui';
import { HEALTH_RECORD_COLORS, HEALTH_RECORD_ICONS, HEALTH_RECORD_TYPES } from '@/constants';
import { useTheme } from '@/lib/theme';
import { getReadableTextColor } from '@/lib/utils/colorContrast';

interface HealthRecordTypePickerProps {
  selectedType?: string | null;
  onSelect: (type: string) => void;
  label?: string;
  error?: string;
  testID?: string;
}

const HealthRecordTypePicker: React.FC<HealthRecordTypePickerProps> = ({
  selectedType,
  onSelect,
  label,
  error,
  testID,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const recordTypes = Object.values(HEALTH_RECORD_TYPES);

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      )}
      <View style={styles.chipContainer} testID={testID}>
        {recordTypes.map((type) => {
          const isSelected = selectedType === type;
          const chipColor = HEALTH_RECORD_COLORS[type as keyof typeof HEALTH_RECORD_COLORS];
          const iconName = HEALTH_RECORD_ICONS[type as keyof typeof HEALTH_RECORD_ICONS];
          const selectedTextColor = getReadableTextColor(
            chipColor,
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
                isSelected && { backgroundColor: chipColor },
              ]}
              icon={({ size }) => (
                <MaterialCommunityIcons
                  name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={size}
                  color={iconColor}
                />
              )}
              textStyle={{ color: iconColor }}
              mode={isSelected ? 'flat' : 'outlined'}
            >
              {t(`healthRecordTypes.${type}`, type)}
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

export default HealthRecordTypePicker;
