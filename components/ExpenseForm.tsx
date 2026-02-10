import React from 'react';
import { StyleSheet, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, Text, TextInput, KeyboardAwareView } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { ExpenseCreateFormInput, ExpenseCreateSchema } from '../lib/schemas/expenseSchema';
import { CreateExpenseInput as CreateExpenseInputType, Expense, ExpenseCategory } from '../lib/types';
import { toISODateString } from '../lib/utils/dateConversion';
import { SmartCategoryPicker } from './forms/SmartCategoryPicker';
import { SmartDatePicker } from './forms/SmartDatePicker';
import { SmartNumberInput } from './forms/SmartNumberInput';
import { SmartPaymentMethodPicker } from './forms/SmartPaymentMethodPicker';
import { SmartPetPicker } from './forms/SmartPetPicker';
import { FormSection } from './forms/FormSection';
import { StepHeader } from './forms/StepHeader';

interface ExpenseFormProps {
  petId?: string;
  initialData?: Expense;
  onSubmit: (data: CreateExpenseInputType) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  petId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [showStepError, setShowStepError] = React.useState(false);

  const defaultValues = {
    petId,
    category: initialData?.category || ('food' as ExpenseCategory),
    amount: initialData?.amount || 0,
    paymentMethod: initialData?.paymentMethod || undefined,
    date: initialData?.date || toISODateString(new Date()) || '',
  };

  const methods = useForm<ExpenseCreateFormInput>({
    resolver: zodResolver(ExpenseCreateSchema()),
    defaultValues,
  });

  const { handleSubmit, trigger } = methods;

  const handleFormSubmit = React.useCallback(
    (data: ExpenseCreateFormInput) => {
      onSubmit(data as CreateExpenseInputType);
    },
    [onSubmit]
  );

  const isEditMode = Boolean(initialData);

  const steps = React.useMemo(
    () => {
      const createSteps = [
        {
          key: 'pet',
          title: t('expenses.steps.petCategory'),
          fields: ['petId'] as (keyof ExpenseCreateFormInput)[],
        },
        {
          key: 'amount',
          title: t('expenses.steps.amount'),
          fields: ['category', 'amount'] as (keyof ExpenseCreateFormInput)[],
        },
        {
          key: 'details',
          title: t('expenses.steps.details'),
          fields: ['date', 'paymentMethod'] as (keyof ExpenseCreateFormInput)[],
        },
      ];

      if (isEditMode) {
        return createSteps.slice(1);
      }

      return createSteps;
    },
    [t, isEditMode]
  );

  const totalSteps = steps.length;
  const isFinalStep = currentStep === totalSteps - 1;

  const handleNextStep = React.useCallback(async () => {
    const isStepValid = await trigger(steps[currentStep].fields);
    if (!isStepValid) {
      setShowStepError(true);
      return;
    }
    setShowStepError(false);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [trigger, steps, currentStep, totalSteps]);

  const handleBackStep = React.useCallback(() => {
    setShowStepError(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleFinalSubmit = React.useCallback(async () => {
    const isFormValid = await trigger();
    if (!isFormValid) {
      setShowStepError(true);
      return;
    }
    setShowStepError(false);
    handleSubmit(handleFormSubmit)();
  }, [trigger, handleSubmit, handleFormSubmit]);

  const categoryAndAmountStep = isEditMode ? 0 : 1;
  const dateAndPaymentStep = isEditMode ? 1 : 2;

  return (
    <FormProvider {...methods}>
      <KeyboardAwareView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.form}>
        <StepHeader
          title={steps[currentStep].title}
          counterLabel={t('expenses.stepIndicator', { current: currentStep + 1, total: totalSteps })}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />

        {!isEditMode && currentStep === 0 && (
          <>
            {/* Pet Selection */}
            <FormSection title={t('forms.petSelection', 'Pet Selection')}>
              <SmartPetPicker
                name="petId"
                label={t('common.selectPet')}
                required
              />
            </FormSection>
          </>
        )}

        {currentStep === categoryAndAmountStep && (
          <>
            <SmartCategoryPicker
              name="category"
              label={t('expenses.category', 'Category')}
            />

            {/* Amount */}
            <SmartNumberInput
              name="amount"
              label={t('expenses.amount', 'Amount')}
              required
              decimal
              precision={2}
              min={0.01}
              left={<TextInput.Icon icon="cash-outline" />}
            />

          </>
        )}

        {currentStep === dateAndPaymentStep && (
          <>
            {/* Date Picker */}
            <SmartDatePicker
              name="date"
              label={t('expenses.date', 'Date')}
              mode="date"
              outputFormat="iso"
              maximumDate={new Date()}
            />

            <SmartPaymentMethodPicker
              name="paymentMethod"
              label={t('expenses.paymentMethod', 'Payment Method')}
              optional
            />
          </>
        )}

        <View style={styles.buttonContainer}>
          {currentStep === 0 ? (
            <Button
              mode="outlined"
              onPress={onCancel}
              style={styles.button}
              disabled={isSubmitting}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={handleBackStep}
              style={styles.button}
              disabled={isSubmitting}
            >
              {t('common.back', 'Back')}
            </Button>
          )}
          {isFinalStep ? (
            <Button
              mode="contained"
              onPress={handleFinalSubmit}
              style={styles.button}
              disabled={isSubmitting}
            >
              {initialData ? t('common.update', 'Update') : t('common.create', 'Create')}
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleNextStep}
              style={styles.button}
              disabled={isSubmitting}
            >
              {t('common.next', 'Next')}
            </Button>
          )}
        </View>

        {!showStepError ? null : (
          <View style={[styles.statusContainer, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={[styles.statusText, { color: theme.colors.onErrorContainer }]}>
              {t('pets.pleaseFillRequiredFields')}
            </Text>
          </View>
        )}
      </KeyboardAwareView>
    </FormProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  statusContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'System',
  },
});

export default ExpenseForm;
