import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text,  } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { ExpenseCategory } from '../lib/types';
import { EXPENSE_CATEGORIES } from '../lib/schemas/expenseSchema';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CategoryPickerProps {
  selectedCategory?: ExpenseCategory | null;
  onSelect: (category: ExpenseCategory) => void;
  label?: string;
  error?: string;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategory,
  onSelect,
  label,
  error,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const getCategoryIcon = (category: ExpenseCategory): keyof typeof MaterialCommunityIcons.glyphMap => {
    const icons: Record<ExpenseCategory, keyof typeof MaterialCommunityIcons.glyphMap> = {
      food: 'food',
      premium_food: 'food-variant',
      veterinary: 'hospital-box',
      vaccination: 'needle',
      medication: 'pill',
      grooming: 'content-cut',
      toys: 'soccer',
      accessories: 'shopping',
      training: 'school',
      insurance: 'shield-check',
      emergency: 'alert-circle',
      other: 'dots-horizontal',
    };
    return icons[category] || 'cash';
  };

  const getCategoryColor = (category: ExpenseCategory): string => {
    const colors: Record<ExpenseCategory, string> = {
      food: theme.colors.primary,
      premium_food: theme.colors.tertiary,
      veterinary: theme.colors.error,
      vaccination: theme.colors.secondary,
      medication: theme.colors.inversePrimary,
      grooming: theme.colors.tertiaryContainer,
      toys: theme.colors.primaryContainer,
      accessories: theme.colors.secondaryContainer,
      training: theme.colors.surfaceVariant,
      insurance: theme.colors.outline,
      emergency: theme.colors.errorContainer,
      other: theme.colors.surface,
    };
    return colors[category] || theme.colors.surface;
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
          {label}
        </Text>
      )}
      <View style={styles.chipContainer}>
        {EXPENSE_CATEGORIES.map((category) => (
          <Chip
            key={category}
            selected={selectedCategory === category}
            onPress={() => onSelect(category)}
            style={[
              styles.chip,
              selectedCategory === category && {
                backgroundColor: getCategoryColor(category),
              },
            ]}
            icon={({ size }: { size: number }) => (
              <MaterialCommunityIcons
                name={getCategoryIcon(category)}
                size={size}
                color={
                  selectedCategory === category
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurface
                }
              />
            )}
            textStyle={{
              color:
                selectedCategory === category
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurface,
            }}
            mode={selectedCategory === category ? 'flat' : 'outlined'}
          >
            {t(`expenses.categories.${category}`, category)}
          </Chip>
        ))}
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

export default CategoryPicker;
