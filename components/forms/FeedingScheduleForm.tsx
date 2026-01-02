import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { FormProvider, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@/components/ui';
import { useFeedingScheduleForm } from '@/hooks/useFeedingScheduleForm';
import { useTheme } from '@/lib/theme';
import { createFoodTypeOptions } from '../../constants';
import { type FeedingScheduleFormData } from '../../lib/schemas/feedingScheduleSchema';
import { FeedingSchedule, Pet } from '../../lib/types';
import { FormSection } from './FormSection';
import { SmartDatePicker } from './SmartDatePicker';
import { SmartDayPicker } from './SmartDayPicker';
import { SmartDropdown } from './SmartDropdown';
import { SmartInput } from './SmartInput';
import { SmartPetPicker } from './SmartPetPicker';
import { SmartSwitch } from './SmartSwitch';
import { StepHeader } from './StepHeader';

interface FeedingScheduleFormProps {
  schedule?: FeedingSchedule;
  onSubmit: (data: FeedingScheduleFormData) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialPetId?: string;
  pets?: Pet[];
  testID?: string;
}

export function FeedingScheduleForm({
  schedule,
  onSubmit,
  onCancel,
  loading = false,
  initialPetId,
  pets = [],
  testID,
}: FeedingScheduleFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [showStepError, setShowStepError] = React.useState(false);

  // Use the custom hook for form management
  const { form, control, handleSubmit, isDirty } = useFeedingScheduleForm(schedule, initialPetId);

  // Watch form values for dynamic behavior
  const foodType = useWatch({ control, name: 'foodType' });

  // Food type options with i18n support
  const foodTypeOptions = React.useMemo(
    () => createFoodTypeOptions((key: string) => t(key)),
    [t]
  );

  // Food type specific suggestions
  const getFoodTypeSuggestion = () => {
    switch (foodType) {
      case 'dry_food':
        return t('feedingSchedule.suggestions.dryFood');
      case 'wet_food':
        return t('feedingSchedule.suggestions.wetFood');
      case 'raw_food':
        return t('feedingSchedule.suggestions.rawFood');
      case 'homemade':
        return t('feedingSchedule.suggestions.homemade');
      case 'treats':
        return t('feedingSchedule.suggestions.treats');
      case 'supplements':
        return t('feedingSchedule.suggestions.supplements');
      default:
        return t('feedingSchedule.suggestions.default');
    }
  };

  // Handle form submission
  const onFormSubmit = React.useCallback(
    async (data: FeedingScheduleFormData) => {
      try {
        setIsSubmitting(true);


        await onSubmit(data);
      } catch {
        Alert.alert(t('common.error'), t('feedingSchedule.errors.submitFailed'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, t]
  );

  // Form actions
  const handleCancel = React.useCallback(() => {
    if (isDirty) {
      Alert.alert(t('common.unsavedChanges'), t('common.unsavedChangesMessage'), [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.discard'),
          style: 'destructive',
          onPress: onCancel,
        },
      ]);
    } else {
      onCancel();
    }
  }, [isDirty, onCancel, t]);

  const isEditMode = !!schedule;

  const steps = React.useMemo(
    () => [
      {
        key: 'pet',
        title: t('feedingSchedule.steps.pet'),
        fields: ['petId'] as (keyof FeedingScheduleFormData)[],
      },
      {
        key: 'details',
        title: t('feedingSchedule.steps.details'),
        fields: ['time', 'foodType', 'amount'] as (keyof FeedingScheduleFormData)[],
      },
      {
        key: 'days',
        title: t('feedingSchedule.steps.days'),
        fields: ['daysArray'] as (keyof FeedingScheduleFormData)[],
      },
      {
        key: 'settings',
        title: t('feedingSchedule.steps.settings'),
        fields: ['isActive'] as (keyof FeedingScheduleFormData)[],
      },
    ],
    [t]
  );

  const totalSteps = steps.length;
  const isFinalStep = currentStep === totalSteps - 1;

  const handleNextStep = React.useCallback(async () => {
    const isStepValid = await form.trigger(steps[currentStep].fields);
    if (!isStepValid) {
      setShowStepError(true);
      return;
    }
    setShowStepError(false);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [form, steps, currentStep, totalSteps]);

  const handleBackStep = React.useCallback(() => {
    setShowStepError(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleFinalSubmit = React.useCallback(async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) {
      setShowStepError(true);
      return;
    }
    setShowStepError(false);
    handleSubmit(onFormSubmit)();
  }, [form, handleSubmit, onFormSubmit]);

  return (
    <FormProvider {...form}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="always"
        testID={testID}
      >
        <StepHeader
          title={steps[currentStep].title}
          counterLabel={t('feedingSchedule.stepIndicator', { current: currentStep + 1, total: totalSteps })}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />

        {currentStep === 0 && (
          <FormSection
            title={isEditMode ? t('feedingSchedule.editTitle') : t('feedingSchedule.createTitle')}
            subtitle={t('feedingSchedule.subtitle')}
          >
            {/* Pet Selection */}
            <SmartPetPicker
              name="petId"
              required
              label={t('feedingSchedule.fields.pet')}
              pets={pets}
              testID={testID ? `${testID}-pet` : 'feeding-form-pet'}
            />
          </FormSection>
        )}

        {currentStep === 1 && (
          <FormSection
            title={t('feedingSchedule.sections.scheduleDetails')}
            subtitle={t('feedingSchedule.sections.scheduleDetailsSubtitle')}
          >
            {/* Time Picker */}
            <SmartDatePicker
              name="time"
              required
              label={t('feedingSchedule.fields.time')}
              mode="time"
              outputFormat="iso-time"
              testID={`${testID}-time`}
            />

            {/* Food Type Dropdown */}
            <SmartDropdown
              name="foodType"
              required
              options={foodTypeOptions}
              placeholder={t('feedingSchedule.placeholders.selectFoodType')}
              label={t('feedingSchedule.fields.foodType')}
              testID={`${testID}-food-type`}
            />

            {/* Food type suggestion */}
            <View style={[styles.suggestionBox, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Text style={styles.suggestionIcon}>💡</Text>
              <Text
                variant="bodySmall"
                style={[styles.suggestionText, { color: theme.colors.onSecondaryContainer }]}
              >
                {getFoodTypeSuggestion()}
              </Text>
            </View>

            {/* Amount Input */}
            <SmartInput
              name="amount"
              required
              placeholder={t('feedingSchedule.placeholders.amount')}
              testID={`${testID}-amount`}
            />
          </FormSection>
        )}

        {currentStep === 2 && (
          <FormSection
            title={t('feedingSchedule.fields.days')}
            subtitle={t('feedingSchedule.daysHelp')}
          >
            <SmartDayPicker name="daysArray" showQuickSelect testID={testID} />
          </FormSection>
        )}

        {currentStep === 3 && (
          <FormSection title={t('feedingSchedule.sections.settings')}>
            <SmartSwitch
              name="isActive"
              label={t('feedingSchedule.fields.isActive')}
              description={t('feedingSchedule.isActiveHelp')}
              testID={`${testID}-active-switch`}
            />
          </FormSection>
        )}

        <View style={styles.actions}>
          {currentStep === 0 ? (
            <Button
              mode="outlined"
              onPress={handleCancel}
              disabled={loading || isSubmitting}
              style={styles.actionButton}
              testID={testID ? `${testID}-cancel` : 'feeding-form-cancel'}
            >
              {t('common.cancel')}
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={handleBackStep}
              disabled={loading || isSubmitting}
              style={styles.actionButton}
              testID={testID ? `${testID}-back` : 'feeding-form-back'}
            >
              {t('common.back')}
            </Button>
          )}
          {isFinalStep ? (
            <Button
              mode="contained"
              onPress={handleFinalSubmit}
              disabled={loading || isSubmitting}
              loading={isSubmitting}
              style={styles.actionButton}
              testID={testID ? `${testID}-submit` : 'feeding-form-submit'}
            >
              {isEditMode ? t('common.update') : t('common.create')}
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleNextStep}
              disabled={loading || isSubmitting}
              style={styles.actionButton}
              testID={testID ? `${testID}-next` : 'feeding-form-next'}
            >
              {t('common.next')}
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
      </ScrollView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: -8, // Adjust spacing after SmartDropdown
  },
  suggestionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  suggestionText: {
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'System',
  },
});

export default FeedingScheduleForm;
