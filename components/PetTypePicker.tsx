import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Chip, Text } from '@/components/ui';
import { PET_TYPES } from '@/constants';
import { useTheme } from '@/lib/theme';
import { getReadableTextColor } from '@/lib/utils/colorContrast';
import { getPetTypeColor, getPetTypeIcon } from '@/lib/utils/petTypeVisuals';
import { Pet } from '@/lib/types';

interface PetTypePickerProps {
  selectedType?: string | null;
  onSelect: (type: string) => void;
  label?: string;
  error?: string;
  testID?: string;
}

const PetTypePicker: React.FC<PetTypePickerProps> = ({
  selectedType,
  onSelect,
  label,
  error,
  testID,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const petTypes = Object.values(PET_TYPES);

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      )}
      <View style={styles.chipContainer} testID={testID}>
        {petTypes.map((type) => {
          const isSelected = selectedType === type;
          const chipColor = getPetTypeColor(type as Pet['type']);
          const selectedTextColor = getReadableTextColor(
            chipColor,
            theme.colors.onPrimary,
            theme.colors.onSurface
          );

          return (
            <Chip
              key={type}
              selected={isSelected}
              onPress={() => onSelect(type)}
              style={[
                styles.chip,
                isSelected && { backgroundColor: chipColor },
              ]}
              icon={({ size, color }) => (
                <Ionicons
                  name={getPetTypeIcon(type as Pet['type'])}
                  size={size}
                  color={isSelected ? selectedTextColor : color}
                />
              )}
              textColor={isSelected ? selectedTextColor : theme.colors.onSurface}
              mode={isSelected ? 'flat' : 'outlined'}
            >
              {t(`petTypes.${type}`, type)}
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

export default PetTypePicker;
