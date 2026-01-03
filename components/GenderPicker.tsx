import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from '@/components/ui';
import { PET_GENDERS } from '@/constants';
import { useTheme } from '@/lib/theme';
import { getGenderColor, getGenderIcon } from '@/lib/utils/genderVisuals';

interface GenderPickerProps {
  selectedGender?: string | null;
  onSelect: (gender: string) => void;
  label?: string;
  error?: string;
  testID?: string;
}

const GenderPicker: React.FC<GenderPickerProps> = ({
  selectedGender,
  onSelect,
  label,
  error,
  testID,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const genders = Object.values(PET_GENDERS);

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipContainer}
        testID={testID}
      >
        {genders.map((gender) => {
          const isSelected = selectedGender === gender;
          const genderColor = getGenderColor(gender);
          const icon = getGenderIcon(gender);

          return (
            <Chip
              key={gender}
              selected={isSelected}
              onPress={() => onSelect(gender)}
              style={[
                styles.chip,
                isSelected && { backgroundColor: genderColor },
              ]}
              icon={({ size, color }) => (
                <Ionicons
                  name={icon}
                  size={size}
                  color={isSelected ? theme.colors.onSurface : color}
                />
              )}
              textColor={isSelected ? theme.colors.onSurface : theme.colors.onSurface}
              mode={isSelected ? 'flat' : 'outlined'}
            >
              {t(`gender.${gender}`, gender)}
            </Chip>
          );
        })}
      </ScrollView>
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
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    marginRight: 8,
  },
  error: {
    marginTop: 4,
    marginLeft: 4,
  },
});

export default GenderPicker;
