import React from 'react';
import { Control, Controller, FieldValues, Path, useWatch } from 'react-hook-form';
import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/lib/theme';

// Custom hook for managing weight input state
const useWeightInputState = (value: number | undefined, precision: number) => {
  const [displayText, setDisplayText] = React.useState(() => {
    if (value === undefined || value === null) return '';
    return value.toFixed(precision);
  });

  React.useEffect(() => {
    setDisplayText(value === undefined || value === null ? '' : value.toFixed(precision));
  }, [precision, value]);

  return { displayText, setDisplayText };
};

const getStepPrecision = (step: number) => {
  if (!Number.isFinite(step)) return 0;

  const stepText = String(step);
  if (stepText.includes('e-')) {
    const exp = Number(stepText.split('e-')[1]);
    return Number.isFinite(exp) ? exp : 0;
  }

  const decimalPart = stepText.split('.')[1];
  return decimalPart ? decimalPart.length : 0;
};

interface FormWeightInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  testID?: string;
}

export function FormWeightInput<T extends FieldValues>({
  control,
  name,
  label,
  required = false,
  disabled = false,
  placeholder,
  min = 0.1,
  max = 200,
  step = 0.1,
  unit = 'kg',
  testID,
}: FormWeightInputProps<T>) {
  const { theme } = useTheme();

  const precision = React.useMemo(() => getStepPrecision(step), [step]);

  const inputRef = React.useRef<TextInput>(null);
  const inputAccessoryViewID = React.useMemo(() => {
    const base = String(name).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `weight-input-${base}`;
  }, [name]);

  const dismissKeyboard = React.useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const parseWeightValue = (text: string): number | undefined => {
    if (!text.trim()) return undefined;

    const cleanText = text.replace(',', '.').replace(/[^\d.]/g, '');
    const numValue = parseFloat(cleanText);

    if (isNaN(numValue)) return undefined;
    if (numValue < min) return min;
    if (numValue > max) return max;

    // Round to step precision
    const roundedValue = step > 0 ? Math.round(numValue / step) * step : numValue;
    return parseFloat(roundedValue.toFixed(precision));
  };

  const formatWeightValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return '';
    return value.toFixed(precision);
  };

  // Watch the field value for changes
  const fieldValue = useWatch({ control, name });
  const { displayText, setDisplayText } = useWeightInputState(fieldValue, precision);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {

        const handleTextChange = (text: string) => {
          setDisplayText(text);

          const parsedValue = parseWeightValue(text);
          if (parsedValue !== undefined) {
            field.onChange(parsedValue);
          } else if (text.trim() === '') {
            field.onChange(undefined);
          }
        };

        const handleBlur = () => {
          field.onBlur();

          // Format the display text on blur
          const formattedValue = formatWeightValue(field.value);
          setDisplayText(formattedValue);
        };

        return (
          <View style={styles.container}>
            {label ? (
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                {label}{required ? ' *' : ''}
              </Text>
            ) : null}

            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                value={displayText}
                onChangeText={handleTextChange}
                onBlur={handleBlur}
                onSubmitEditing={dismissKeyboard}
                blurOnSubmit
                placeholder={placeholder || '0.0'}
                keyboardType="decimal-pad"
                returnKeyType="done"
                inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
                editable={!disabled}
                maxLength={6} // Max like 999.9 kg
                style={[
                  styles.weightInput,
                  {
                    borderColor: fieldState.error
                      ? theme.colors.error
                      : fieldState.isTouched
                        ? theme.colors.primary
                        : theme.colors.outline,
                    backgroundColor: disabled
                      ? theme.colors.surfaceDisabled
                      : theme.colors.surface,
                    color: theme.colors.onSurface,
                  }
                ]}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                testID={testID}
              />

              <View style={[styles.unitContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.unitText, { color: theme.colors.onSurfaceVariant }]}>
                  {unit}
                </Text>
              </View>
            </View>

            {Platform.OS === 'ios' && (
              <InputAccessoryView nativeID={inputAccessoryViewID}>
                <View
                  style={[
                    styles.inputAccessory,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderTopColor: theme.colors.outline,
                    },
                  ]}
                >
                  <View style={styles.inputAccessorySpacer} />
                  <Pressable
                    onPress={dismissKeyboard}
                    accessibilityRole="button"
                    style={styles.doneButton}
                  >
                    <Text style={[styles.doneButtonText, { color: theme.colors.primary }]}>Done</Text>
                  </Pressable>
                </View>
              </InputAccessoryView>
            )}

            {fieldState.error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {fieldState.error.message}
              </Text>
            )}

            <View style={styles.helperContainer}>
              <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
                Min: {min}{unit} - Max: {max}{unit}
              </Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    marginLeft: 4,
    fontFamily: 'System',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  weightInput: {
    flex: 1,
    borderWidth: 2,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'System',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  unitContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 2,
    borderLeftWidth: 1,
    minWidth: 50,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'System',
  },
  helperContainer: {
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'System',
  },
  inputAccessory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputAccessorySpacer: {
    flex: 1,
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
  },
});

export default FormWeightInput;
