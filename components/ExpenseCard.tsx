import { Card, Chip, IconButton, Text } from '@/components/ui';
import { getExpenseCategoryConfig } from '@/constants/expenseConfig';
import { useTheme } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Expense } from '../lib/types';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { settings } = useUserSettingsStore();
  const baseCurrency = settings?.baseCurrency || 'TRY';

  const categoryConfig = getExpenseCategoryConfig(expense.category);
  const resolveColor = (colorValue: string) => {
    if (colorValue.startsWith("#")) return colorValue;
    return theme.colors[colorValue as keyof typeof theme.colors] || theme.colors.primary;
  };
  const withOpacity = (color: string, opacity: number) => {
    if (!color.startsWith("#")) return color;
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${alpha}`;
  };
  const categoryColor = resolveColor(categoryConfig.color);
  const iconBackground = withOpacity(categoryColor, 0.15);

  const formattedDate = React.useMemo(() => {
    try {
      return formatDate(expense.date, 'PPP');
    } catch {
      return expense.date.toString();
    }
  }, [expense.date]);

  const cardContent = (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.surfaceVariant,
        },
      ]}
      elevation={2}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: iconBackground }]}>
              <MaterialCommunityIcons
                name={categoryConfig.icon}
                size={24}
                color={categoryColor}
              />
            </View>
            <View style={styles.headerText}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {t(`expenses.categories.${expense.category}`, expense.category)}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formattedDate}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text variant="titleLarge" style={[styles.amount, { color: theme.colors.primary }]}>
              {formatCurrency(expense.amount, expense.currency)}
            </Text>
            {expense.currency !== baseCurrency && expense.amountBase && (
              <Text variant="bodySmall" style={[styles.baseAmount, { color: theme.colors.onSurfaceVariant }]}>
                ≈ {formatCurrency(expense.amountBase, baseCurrency)}
              </Text>
            )}
          </View>
        </View>

        {expense.description && (
          <Text
            variant="bodyMedium"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {expense.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.tags}>
            {expense.paymentMethod && (
              <Chip
                mode="outlined"
                compact
                style={[
                  styles.chip,
                  {
                    borderColor: theme.colors.outlineVariant,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                textStyle={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}
              >
                {t(`expenses.paymentMethods.${expense.paymentMethod}`, expense.paymentMethod)}
              </Chip>
            )}
            {expense.vendor && (
              <Chip
                mode="outlined"
                compact
                style={[
                  styles.chip,
                  {
                    borderColor: theme.colors.outlineVariant,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                textStyle={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}
                icon="store"
              >
                {expense.vendor}
              </Chip>
            )}
          </View>

          {showActions && (
            <View style={styles.actions}>
              {onEdit && (
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={onEdit}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              )}
              {onDelete && (
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={onDelete}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  pressable: {
  },
  card: {
    marginVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  baseAmount: {
    marginTop: 2,
    marginLeft: 8,
  },
  description: {
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  tags: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 28,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
});

export default ExpenseCard;
