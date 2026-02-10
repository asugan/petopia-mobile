import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Control, FieldErrors, FieldValues, Path, PathValue, useForm, UseFormReturn } from 'react-hook-form';
import {
  type HealthRecordCreateInput,
  type HealthRecordCreateFormInput,
  HealthRecordCreateFormSchema,
} from '../lib/schemas/healthRecordSchema';
import { HealthRecord } from '../lib/types';

// Form hook types
export interface UseHealthRecordFormReturn {
  form: UseFormReturn<HealthRecordCreateFormInput>;
  control: Control<HealthRecordCreateFormInput>;
  errors: FieldErrors<HealthRecordCreateFormInput>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  touchedFields: UseFormReturn<HealthRecordCreateFormInput>['formState']['touchedFields'];
  dirtyFields: UseFormReturn<HealthRecordCreateFormInput>['formState']['dirtyFields'];
  handleSubmit: (
    onSubmit: (data: HealthRecordCreateFormInput) => void | Promise<void>
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  reset: (values?: HealthRecordCreateFormInput) => void;
  setValue: <K extends Path<HealthRecordCreateFormInput>>(name: K, value: PathValue<HealthRecordCreateFormInput, K>) => void;
  getValues: {
    (): HealthRecordCreateFormInput;
    <K extends keyof HealthRecordCreateFormInput>(name: K): HealthRecordCreateFormInput[K];
  };
  trigger: (name?: keyof HealthRecordCreateFormInput) => Promise<boolean>;
  watch: {
    (): HealthRecordCreateFormInput;
    <K extends keyof HealthRecordCreateFormInput>(name: K): HealthRecordCreateFormInput[K];
  };
}

// Main hook for health record form - handles both create and edit modes
export const useHealthRecordForm = (
  petId: string,
  initialData?: HealthRecord
): UseHealthRecordFormReturn => {
  // Default values - comprehensive for all health record types
  const defaultValues: HealthRecordCreateFormInput = React.useMemo(() => {
    return {
      petId,
      type: initialData?.type || 'checkup',
      title: initialData?.title || '',
      date: initialData?.date || new Date(),
      treatmentPlan: initialData?.treatmentPlan || [],
    };
  }, [petId, initialData]);

  const form = useForm<HealthRecordCreateFormInput>({
    resolver: zodResolver(HealthRecordCreateFormSchema()),
    defaultValues,
    mode: 'onChange', // Validate on change for better UX
    reValidateMode: 'onChange',
  });

  return {
    form,
    control: form.control,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    touchedFields: form.formState.touchedFields,
    dirtyFields: form.formState.dirtyFields,
    handleSubmit: form.handleSubmit,
    reset: form.reset,
    setValue: form.setValue,
    getValues: form.getValues,
    trigger: form.trigger,
    watch: form.watch,
  };
};

export default useHealthRecordForm;
