import { Switch, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface SmartSwitchProps {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  testID?: string;
  onValueChange?: (value: boolean) => void;
}

/**
 * SmartSwitch component wraps Switch with react-hook-form Controller.
 * Provides label, description, and automatic form integration.
 */
export const SmartSwitch = ({
  name,
  label,
  description,
  disabled,
  testID,
  onValueChange,
}: SmartSwitchProps) => {
  const { control } = useFormContext();
  const { theme } = useTheme();

  const handleValueChange = (value: boolean) => {
    onValueChange?.(value);
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>{label}</Text>
            {description && (
              <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                {description}
              </Text>
            )}
          </View>
          <Switch
            value={value}
            onValueChange={(val) => {
              onChange(val);
              handleValueChange(val);
            }}
            disabled={disabled}
            testID={testID}
          />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});
