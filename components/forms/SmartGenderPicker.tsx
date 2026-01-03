import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import GenderPicker from '@/components/GenderPicker';

interface SmartGenderPickerProps {
  name: string;
  label?: string;
  testID?: string;
}

export const SmartGenderPicker = ({ name, label, testID }: SmartGenderPickerProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <GenderPicker
            selectedGender={value}
            onSelect={onChange}
            label={label}
            error={error?.message}
            testID={testID}
          />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
