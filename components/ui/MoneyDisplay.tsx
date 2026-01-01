import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Currency } from '@/lib/schemas/expenseSchema';
import { isValidCurrency } from '@/lib/schemas/expenseSchema';
import { useTheme } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils/currency';

type MoneyDisplaySize = 'small' | 'medium' | 'large';

export interface MoneyDisplayProps {
  amount: number | null | undefined;
  currency?: Currency | string | null;
  baseCurrency?: Currency | string | null;
  amountBase?: number | null | undefined;
  size?: MoneyDisplaySize;
  color?: string;
}

function resolveCurrency(value: MoneyDisplayProps['currency'], fallback: Currency): Currency {
  if (typeof value === 'string' && isValidCurrency(value)) return value;
  return fallback;
}

type DisplayTextVariant = 'bodySmall' | 'bodyMedium' | 'titleMedium' | 'labelSmall';

function getVariants(
  size: MoneyDisplaySize
): { primary: DisplayTextVariant, secondary: DisplayTextVariant } {
  switch (size) {
    case 'small':
      return { primary: 'bodySmall', secondary: 'labelSmall' };
    case 'large':
      return { primary: 'titleMedium', secondary: 'bodySmall' };
    case 'medium':
    default:
      return { primary: 'bodyMedium', secondary: 'bodySmall' };
  }
}

export default function MoneyDisplay({
  amount,
  currency,
  baseCurrency,
  amountBase,
  size = 'medium',
  color,
}: MoneyDisplayProps) {
  const { theme } = useTheme();

  const resolvedBaseCurrency = resolveCurrency(baseCurrency, 'TRY');
  const resolvedCurrency = resolveCurrency(currency, resolvedBaseCurrency);

  const hasAmount = amount !== null && amount !== undefined && !Number.isNaN(amount);
  const hasAmountBase = amountBase !== null && amountBase !== undefined && !Number.isNaN(amountBase);

  const showConverted = hasAmount && resolvedCurrency !== resolvedBaseCurrency && hasAmountBase;
  const showAmountBaseAsPrimary = !hasAmount && hasAmountBase;

  const variants = getVariants(size);
  const primaryColor = color ?? theme.colors.onSurface;

  if (!hasAmount && !hasAmountBase) {
    return (
      <Text variant={variants.primary} style={[styles.primary, { color: theme.colors.onSurfaceVariant }]}>
        -
      </Text>
    );
  }

  if (showAmountBaseAsPrimary) {
    return (
      <View style={styles.row}>
        <Text variant={variants.primary} style={[styles.primary, { color: primaryColor }]}>
          {formatCurrency(amountBase!, resolvedBaseCurrency)}
        </Text>
        {currency && resolvedCurrency !== resolvedBaseCurrency && (
          <Text variant={variants.secondary} style={[styles.secondary, { color: theme.colors.onSurfaceVariant }]}>
            {/* Currency hint when a converted amount isn't available. */}
            ({resolvedCurrency})
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Text variant={variants.primary} style={[styles.primary, { color: primaryColor }]}>
        {formatCurrency(amount!, resolvedCurrency)}
      </Text>
      {!showConverted ? null : (
        <Text variant={variants.secondary} style={[styles.secondary, { color: theme.colors.onSurfaceVariant }]}>
          ≈ {formatCurrency(amountBase!, resolvedBaseCurrency)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 6,
  },
  primary: {
    fontWeight: '700',
  },
  secondary: {
    fontWeight: '600',
  },
});
