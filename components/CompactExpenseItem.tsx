import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getExpenseCategoryConfig } from '@/constants/expenseConfig';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { Expense } from '@/lib/types';
import { useUserSettingsStore } from '@/stores/userSettingsStore';

interface CompactExpenseItemProps {
  expense: Expense;
  onPress?: () => void;
}

const CompactExpenseItem: React.FC<CompactExpenseItemProps> = ({
  expense,
  onPress,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { settings } = useUserSettingsStore();
  const baseCurrency = settings?.baseCurrency || 'TRY';

  const categoryConfig = getExpenseCategoryConfig(expense.category);

  // Format date relative to now (e.g., "2 days ago")
  const formattedDate = React.useMemo(() => {
    try {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      const diffInMs = now.getTime() - expenseDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        return t('common.today', 'Today');
      } else if (diffInDays === 1) {
        return t('common.yesterday', 'Yesterday');
      } else if (diffInDays < 7) {
        return t('common.daysAgo', '{{count}} days ago', { count: diffInDays });
      } else {
        return formatDate(expense.date, 'MMM d');
      }
    } catch {
      return expense.date.toString();
    }
  }, [expense.date, t]);

  const categoryColor = categoryConfig.color.startsWith('#')
    ? categoryConfig.color
    : theme.colors[categoryConfig.color as keyof typeof theme.colors] || theme.colors.secondary;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.container,
      { backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent' }
    ]}>
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
          <MaterialCommunityIcons
            name={categoryConfig.icon}
            size={20}
            color={theme.colors.onPrimary}
          />
        </View>
        <View style={styles.textContainer}>
          <Text variant="labelMedium" numberOfLines={1}>
            {t(`expenses.categories.${expense.category}`)}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text variant="labelMedium" style={{ fontWeight: 'bold' }}>
          {formatCurrency(expense.amount, expense.currency)}
        </Text>
        {expense.currency !== baseCurrency && expense.amountBase && (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}>
            ≈ {formatCurrency(expense.amountBase, baseCurrency)}
          </Text>
        )}
        <Text
          variant="bodySmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: 'right'
          }}
        >
          {formattedDate}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 1,
  },
});

export default CompactExpenseItem;
