import React from 'react';
import { TextInput } from '@/components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { parseCurrencyInput, getCurrencyIcon } from '@/lib/utils/currency';
import type { Currency } from '@/lib/schemas/expenseSchema';

interface CurrencyInputProps {
  value?: number | null;
  onChange: (value: number | null | undefined) => void;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  errorText?: string;
  placeholder?: string;
  testID?: string;
  currency?: Currency;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  disabled = false,
  error = false,
  errorText,
  placeholder,
  testID,
  currency = 'TRY',
}: CurrencyInputProps) {
  const { theme } = useTheme();

  const formatValue = (num?: number | null) => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const parseValue = (text: string) => {
    return parseCurrencyInput(text);
  };

  const handleChangeText = (text: string) => {
    if (!text || text.trim() === '') {
      onChange(null);
      return;
    }
    const parsed = parseValue(text);
    onChange(parsed);
  };

  return (
    <TextInput
      label={label}
      value={formatValue(value)}
      onChangeText={handleChangeText}
      keyboardType="numeric"
      disabled={disabled}
      error={error}
      placeholder={placeholder}
      testID={testID}
      left={<MaterialCommunityIcons name={getCurrencyIcon(currency) as any} size={24} color={theme.colors.onSurfaceVariant} />}
      style={{
        backgroundColor: disabled
          ? theme.colors.surfaceDisabled
          : theme.colors.surface,
      }}
    />
  );
}
