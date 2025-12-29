import React, { useState } from 'react';
import { Alert, Modal as RNModal, ScrollView, StyleSheet, View } from 'react-native';
import { FormProvider } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@/components/ui';
import { useHealthRecordForm } from '@/hooks/useHealthRecordForm';
import { useTheme } from '@/lib/theme';
import { useCreateHealthRecord, useUpdateHealthRecord } from '../../lib/hooks/useHealthRecords';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import {
  formatValidationErrors,
  getHealthRecordSchema,
  type HealthRecordCreateFormInput,
} from '../../lib/schemas/healthRecordSchema';
import type { HealthRecord } from '../../lib/types';
import { FormRow } from './FormRow';
import { FormSection } from './FormSection';
import { SmartCurrencyInput } from './SmartCurrencyInput';
import { SmartDatePicker } from './SmartDatePicker';
import { SmartHealthRecordTypePicker } from './SmartHealthRecordTypePicker';
import { SmartInput } from './SmartInput';
import { SmartPetPicker } from './SmartPetPicker';
import { StepHeader } from './StepHeader';

interface HealthRecordFormProps {
  petId?: string;
  visible: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: HealthRecord;
}

export function HealthRecordForm({
  petId,
  visible,
  onSuccess,
  onCancel,
  initialData,
}: HealthRecordFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showStepError, setShowStepError] = useState(false);
  const createMutation = useCreateHealthRecord();
  const updateMutation = useUpdateHealthRecord();
  const isEditing = !!initialData;
  const { settings } = useUserSettingsStore();
  const baseCurrency = settings?.baseCurrency || 'TRY';

  // Use the custom hook for form management
  const { form, handleSubmit, reset } = useHealthRecordForm(petId || '', initialData);

  const getEmptyFormValues = React.useCallback((): HealthRecordCreateFormInput => ({
    petId: petId || '',
    type: 'checkup',
    title: '',
    description: '',
    date: new Date(),
    veterinarian: '',
    clinic: '',
    cost: undefined,
    notes: '',
  }), [petId]);

  // Reset form when modal visibility changes
  React.useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setShowStepError(false);
      if (initialData) {
        reset({
          petId: initialData.petId,
          type: initialData.type,
          title: initialData.title || '',
          description: initialData.description || '',
          date: initialData.date,
          veterinarian: initialData.veterinarian || '',
          clinic: initialData.clinic || '',
          cost: initialData.cost || undefined,
          notes: initialData.notes || '',
        } as HealthRecordCreateFormInput);
      } else {
        reset(getEmptyFormValues());
      }
    }
  }, [visible, initialData, reset, getEmptyFormValues]);

  const onSubmit = React.useCallback(
    async (data: HealthRecordCreateFormInput) => {
      try {
        setIsLoading(true);

        const normalizedData: HealthRecordCreateFormInput = {
          ...data,
          cost: data.cost ?? undefined,
        };

        // Manual validation based on current type
        const schema = getHealthRecordSchema(normalizedData.type);
        const validationResult = schema.safeParse(normalizedData);

        if (!validationResult.success) {
          const formattedErrors = formatValidationErrors(validationResult.error);
          const errorMessage = formattedErrors.map((err) => err.message).join('\n');
          Alert.alert(t('forms.validation.error'), errorMessage);
          return;
        }

        if (isEditing && initialData?._id) {
          await updateMutation.mutateAsync({
            _id: initialData._id,
            data: validationResult.data,
          });
        } else {
          await createMutation.mutateAsync(validationResult.data);
          reset(getEmptyFormValues());
        }

        onSuccess?.();
      } catch (error) {
        console.error('Health record form error:', error);
        Alert.alert(t('common.error'), t('healthRecords.saveError'));
      } finally {
        setIsLoading(false);
      }
    },
    [
      createMutation,
      getEmptyFormValues,
      initialData,
      isEditing,
      onSuccess,
      reset,
      t,
      updateMutation,
    ]
  );

  const handleCancel = () => {
    onCancel?.();
  };

  const steps = React.useMemo(() => {
    const stepList = [
      {
        key: 'details',
        title: t('healthRecords.steps.details'),
        fields: ['type', 'title', 'description'] as (keyof HealthRecordCreateFormInput)[],
      },
      {
        key: 'date',
        title: t('healthRecords.steps.date'),
        fields: ['date'] as (keyof HealthRecordCreateFormInput)[],
      },
      {
        key: 'provider',
        title: t('healthRecords.steps.provider'),
        fields: ['veterinarian', 'clinic'] as (keyof HealthRecordCreateFormInput)[],
      },
      {
        key: 'costNotes',
        title: t('healthRecords.steps.costNotes'),
        fields: ['cost', 'notes'] as (keyof HealthRecordCreateFormInput)[],
      },
    ];

    if (!isEditing) {
      stepList.unshift({
        key: 'pet',
        title: t('healthRecords.steps.pet'),
        fields: ['petId'] as (keyof HealthRecordCreateFormInput)[],
      });
    }

    return stepList;
  }, [t, isEditing]);

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
    handleSubmit(onSubmit)();
  }, [form, handleSubmit, onSubmit]);

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {isEditing ? t('healthRecords.editTitle') : t('healthRecords.createTitle')}
          </Text>
          <Button mode="text" onPress={handleCancel} disabled={isLoading} compact>
            {t('common.close')}
          </Button>
        </View>
        <FormProvider {...form}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <StepHeader
              title={steps[currentStep].title}
              counterLabel={t('healthRecords.stepIndicator', { current: currentStep + 1, total: totalSteps })}
              currentStep={currentStep}
              totalSteps={totalSteps}
            />

            {steps[currentStep].key === 'pet' && (
              <FormSection title={t('healthRecords.petSelection')}>
                <SmartPetPicker
                  name="petId"
                  label={t('common.selectPet')}
                  required
                  testID="health-record-pet"
                />
              </FormSection>
            )}

            {steps[currentStep].key === 'details' && (
              <FormSection
                title={isEditing ? t('healthRecords.editTitle') : t('healthRecords.createTitle')}
                subtitle={t('healthRecords.createSubtitle')}
              >
                {/* Record Type */}
                <SmartHealthRecordTypePicker
                  name="type"
                  label={t('health.recordType')}
                  testID="health-record-type"
                />

                {/* Title */}
                <SmartInput
                  name="title"
                  required
                  placeholder={t('healthRecords.titlePlaceholder')}
                  label={t('healthRecords.titleField')}
                />

                {/* Description */}
                <SmartInput
                  name="description"
                  placeholder={t('healthRecords.descriptionPlaceholder')}
                  label={t('healthRecords.descriptionField')}
                  multiline
                  numberOfLines={3}
                />
              </FormSection>
            )}

            {steps[currentStep].key === 'date' && (
              <FormSection title={t('common.dateInformation')}>
                <SmartDatePicker name="date" required label={t('healthRecords.recordDate')} mode="date" />
              </FormSection>
            )}

            {steps[currentStep].key === 'provider' && (
              <FormSection title={t('healthRecords.veterinarianInfo')}>
                <FormRow>
                  <SmartInput name="veterinarian" label={t('healthRecords.veterinarianLabel')} placeholder={t('healthRecords.veterinarianPlaceholder')} />
                  <SmartInput name="clinic" label={t('healthRecords.clinicLabel')} placeholder={t('healthRecords.clinicPlaceholder')} />
                </FormRow>
              </FormSection>
            )}

            {steps[currentStep].key === 'costNotes' && (
              <>
                <FormSection title={t('healthRecords.cost')}>
                  <SmartCurrencyInput
                    name="cost"
                    label={t('healthRecords.cost')}
                    placeholder={t('healthRecords.costPlaceholder')}
                    currency={baseCurrency}
                  />
                </FormSection>

                <FormSection title={t('common.notes')}>
                  <SmartInput
                    name="notes"
                    placeholder={t('healthRecords.notesPlaceholder')}
                    multiline
                    numberOfLines={4}
                  />
                </FormSection>
              </>
            )}

            <View style={styles.actions}>
              {currentStep === 0 ? (
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  disabled={isLoading}
                  style={styles.actionButton}
                >
                  {t('common.cancel')}
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  onPress={handleBackStep}
                  disabled={isLoading}
                  style={styles.actionButton}
                >
                  {t('common.back')}
                </Button>
              )}
              {isFinalStep ? (
                <Button
                  mode="contained"
                  onPress={handleFinalSubmit}
                  disabled={isLoading}
                  loading={isLoading}
                  style={styles.actionButton}
                >
                  {isEditing ? t('common.update') : t('common.save')}
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleNextStep}
                  disabled={isLoading}
                  style={styles.actionButton}
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
      </SafeAreaView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
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
