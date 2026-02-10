import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, KeyboardAwareView } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { usePetForm } from '../../hooks/usePetForm';
import { PetCreateFormInput } from '../../lib/schemas/petSchema';
import { Pet } from '../../lib/types';
import { FormSection } from './FormSection';
import { FormWeightInput } from './FormWeightInput';
import { SmartDatePicker } from './SmartDatePicker';
import { SmartGenderPicker } from './SmartGenderPicker';
import { SmartInput } from './SmartInput';
import { SmartPetPhotoPicker } from './SmartPetPhotoPicker';
import { SmartPetTypePicker } from './SmartPetTypePicker';
import { StepHeader } from './StepHeader';
import { showToast } from '@/lib/toast/showToast';

interface PetFormProps {
  pet?: Pet;
  onSubmit: (data: PetCreateFormInput) => void | boolean | Promise<void | boolean>;
  onCancel: () => void;
  onError?: (error: unknown) => void;
  loading?: boolean;
  testID?: string;
}

export function PetForm({
  pet,
  onSubmit,
  onCancel,
  onError,
  loading = false,
  testID,
}: PetFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { form, handleSubmit } = usePetForm(pet);

  const [currentStep, setCurrentStep] = React.useState(0);

  const onFormSubmit = React.useCallback(
    async (data: PetCreateFormInput) => {
      try {
        const result = await onSubmit(data);

        if (result === false) {
          const submitError = new Error('Pet form submit failed');
          if (__DEV__) {
            console.error('Pet form submit failed', submitError);
          }
          showToast({
            type: 'error',
            title: t('common.error'),
            message: t('errors.generalError'),
          });
          onError?.(submitError);
          throw submitError;
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Pet form submit failed', error);
        }
        showToast({
          type: 'error',
          title: t('common.error'),
          message: t('errors.generalError'),
        });
        onError?.(error);
        throw error;
      }
    },
    [onSubmit, onError, t]
  );

  const isEditMode = !!pet;

  const steps = React.useMemo(
    () => [
      {
        key: 'basic',
        title: t('forms.petForm.steps.basicInfo'),
        fields: ['name', 'type'] as (keyof PetCreateFormInput)[],
      },
      {
        key: 'details',
        title: t('forms.petForm.steps.physicalDetails'),
        fields: ['gender', 'birthDate'] as (keyof PetCreateFormInput)[],
      },
      {
        key: 'measurements',
        title: t('forms.petForm.steps.breedWeight', `${t('forms.petForm.breed')} & ${t('forms.petForm.weight')}`),
        fields: ['breed', 'weight'] as (keyof PetCreateFormInput)[],
      },
      {
        key: 'photo',
        title: t('forms.petForm.steps.photo'),
        fields: ['profilePhoto'] as (keyof PetCreateFormInput)[],
      },
    ],
    [t]
  );

  const totalSteps = steps.length;
  const isFinalStep = currentStep === totalSteps - 1;

  const handleNextStep = React.useCallback(async () => {
    const isStepValid = await form.trigger(steps[currentStep].fields);
    if (!isStepValid) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: t('pets.pleaseFillRequiredFields'),
      });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [form, steps, currentStep, totalSteps, t]);

  const handleBackStep = React.useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleFinalSubmit = React.useCallback(async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: t('pets.pleaseFillRequiredFields'),
      });
      return;
    }
    handleSubmit(onFormSubmit)();
  }, [form, handleSubmit, onFormSubmit, t]);

  return (
    <FormProvider {...form}>
      <KeyboardAwareView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        testID={testID}
      >
        <StepHeader
          title={steps[currentStep].title}
          counterLabel={t('forms.petForm.stepIndicator', { current: currentStep + 1, total: totalSteps })}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />

        {/* Form Header */}
        {currentStep === 0 && (
          <FormSection
            title={isEditMode ? t('forms.petForm.editPet') : t('forms.petForm.addNewPet')}
            subtitle={t('forms.petForm.subtitle')}
          >
            {/* Pet Name */}
            <SmartInput
              name="name"
              required
              placeholder={t('forms.petForm.petNamePlaceholder')}
              maxLength={50}
              autoCapitalize="words"
              testID="pet-name-input"
            />

            {/* Pet Type */}
            <SmartPetTypePicker
              name="type"
              label={t('forms.petForm.type')}
              testID="pet-type-dropdown"
            />

          </FormSection>
        )}

        {currentStep === 1 && (
          <FormSection title={t('forms.petForm.sections.physicalDetails')}>
            {/* Gender */}
            <SmartGenderPicker
              name="gender"
              label={t('forms.petForm.gender')}
              testID="pet-gender-picker"
            />

            {/* Birth Date */}
            <SmartDatePicker
              name="birthDate"
              label={t('forms.petForm.birthDate')}
              testID="pet-birthdate-picker"
            />

          </FormSection>
        )}

        {currentStep === 2 && (
          <FormSection title={t('forms.petForm.breed')}>
            {/* Pet Breed */}
            <SmartInput
              name="breed"
              placeholder={t('forms.petForm.breedPlaceholder')}
              maxLength={100}
              autoCapitalize="words"
              testID="pet-breed-input"
            />

            {/* Weight */}
            <FormWeightInput
              control={form.control}
              name="weight"
              placeholder={t('forms.petForm.weightPlaceholder')}
              min={0.1}
              max={200}
              step={0.1}
              testID="pet-weight-input"
            />
          </FormSection>
        )}

        {currentStep === 3 && (
          <FormSection title={t('forms.petForm.sections.photo')}>
            <SmartPetPhotoPicker name="profilePhoto" disabled={loading} />
          </FormSection>
        )}

        <View style={styles.actions}>
          {currentStep === 0 ? (
            <Button
              mode="outlined"
              onPress={onCancel}
              disabled={loading}
              style={styles.actionButton}
              testID={testID ? `${testID}-cancel` : 'pet-form-cancel'}
            >
              {t('pets.cancel')}
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={handleBackStep}
              disabled={loading}
              style={styles.actionButton}
              testID={testID ? `${testID}-back` : 'pet-form-back'}
            >
              {t('common.back')}
            </Button>
          )}
          {isFinalStep ? (
            <Button
              mode="contained"
              onPress={handleFinalSubmit}
              disabled={loading}
              loading={loading}
              style={styles.actionButton}
              testID={testID ? `${testID}-submit` : 'pet-form-submit'}
            >
              {isEditMode ? t('pets.update') : t('pets.add')}
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleNextStep}
              disabled={loading}
              style={styles.actionButton}
              testID={testID ? `${testID}-next` : 'pet-form-next'}
            >
              {t('common.next')}
            </Button>
          )}
        </View>

        {/* Form Status */}
      </KeyboardAwareView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});

export default PetForm;
