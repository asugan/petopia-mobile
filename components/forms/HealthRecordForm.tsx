import React, { useState } from 'react';
import { Modal as RNModal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FormProvider, useFieldArray } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, KeyboardAwareView, Text } from '@/components/ui';
import { useHealthRecordForm } from '@/hooks/useHealthRecordForm';
import { useTheme } from '@/lib/theme';
import { showToast } from '@/lib/toast/showToast';
import { useCreateHealthRecord, useUpdateHealthRecord } from '../../lib/hooks/useHealthRecords';
import {
  formatValidationErrors,
  HealthRecordCreateSchema,
  HealthRecordUpdateSchema,
  type HealthRecordCreateFormInput,
} from '../../lib/schemas/healthRecordSchema';
import type { HealthRecord } from '../../lib/types';
import { FormRow } from './FormRow';
import { FormSection } from './FormSection';
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

  const { form, handleSubmit, reset } = useHealthRecordForm(petId || '', initialData);

  const { fields: treatmentFields, append: appendTreatment, remove: removeTreatment } = useFieldArray({
    control: form.control,
    name: 'treatmentPlan',
  });

  const getEmptyFormValues = React.useCallback(
    (): HealthRecordCreateFormInput => ({
      petId: petId || '',
      type: 'checkup',
      title: '',
      date: new Date(),
      treatmentPlan: [],
    }),
    [petId]
  );

  React.useEffect(() => {
    if (!visible) return;

    setCurrentStep(0);
    setShowStepError(false);

    if (initialData) {
      reset({
        petId: initialData.petId,
        type: initialData.type,
        title: initialData.title || '',
        date: initialData.date,
        treatmentPlan: initialData.treatmentPlan || [],
      } as HealthRecordCreateFormInput);
      return;
    }

    reset(getEmptyFormValues());
  }, [visible, initialData, reset, getEmptyFormValues]);

  const onSubmit = React.useCallback(
    async (data: HealthRecordCreateFormInput) => {
      try {
        setIsLoading(true);

        if (isEditing && initialData?._id) {
          const validationResult = HealthRecordUpdateSchema().safeParse(data);

          if (!validationResult.success) {
            const formattedErrors = formatValidationErrors(validationResult.error);
            const errorMessage = formattedErrors.map((err) => err.message).join('\n');
            showToast({
              type: 'error',
              title: t('forms.validation.error'),
              message: errorMessage,
            });
            return;
          }

          await updateMutation.mutateAsync({
            _id: initialData._id,
            data: validationResult.data,
          });
        } else {
          const validationResult = HealthRecordCreateSchema().safeParse(data);

          if (!validationResult.success) {
            const formattedErrors = formatValidationErrors(validationResult.error);
            const errorMessage = formattedErrors.map((err) => err.message).join('\n');
            showToast({
              type: 'error',
              title: t('forms.validation.error'),
              message: errorMessage,
            });
            return;
          }

          await createMutation.mutateAsync(validationResult.data);
          reset(getEmptyFormValues());
        }

        onSuccess?.();
      } catch {
        showToast({
          type: 'error',
          title: t('common.error'),
          message: t('healthRecords.saveError'),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [createMutation, getEmptyFormValues, initialData, isEditing, onSuccess, reset, t, updateMutation]
  );

  const steps = React.useMemo(() => {
    const stepList = [
      {
        key: 'details',
        title: t('healthRecords.steps.details'),
        fields: ['type', 'title'] as (keyof HealthRecordCreateFormInput)[],
      },
      {
        key: 'date',
        title: t('healthRecords.steps.date'),
        fields: ['date'] as (keyof HealthRecordCreateFormInput)[],
      },
      {
        key: 'treatment',
        title: t('healthRecords.treatmentPlan'),
        fields: ['treatmentPlan'] as (keyof HealthRecordCreateFormInput)[],
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

  const handleCancel = () => onCancel?.();

  return (
    <RNModal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancel}>
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
          <KeyboardAwareView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <StepHeader
              title={steps[currentStep].title}
              counterLabel={t('healthRecords.stepIndicator', { current: currentStep + 1, total: totalSteps })}
              currentStep={currentStep}
              totalSteps={totalSteps}
            />

            {steps[currentStep].key === 'pet' && (
              <FormSection title={t('healthRecords.petSelection')}>
                <SmartPetPicker name="petId" label={t('common.selectPet')} required testID="health-record-pet" />
              </FormSection>
            )}

            {steps[currentStep].key === 'details' && (
              <FormSection
                title={isEditing ? t('healthRecords.editTitle') : t('healthRecords.createTitle')}
                subtitle={t('healthRecords.createSubtitle')}
              >
                <SmartHealthRecordTypePicker name="type" label={t('health.recordType')} testID="health-record-type" />
                <SmartInput
                  name="title"
                  required
                  placeholder={t('healthRecords.titlePlaceholder')}
                  label={t('healthRecords.titleField')}
                />
              </FormSection>
            )}

            {steps[currentStep].key === 'date' && (
              <FormSection title={t('common.dateInformation')}>
                <SmartDatePicker name="date" required label={t('healthRecords.recordDate')} mode="date" />
              </FormSection>
            )}

            {steps[currentStep].key === 'treatment' && (
              <FormSection title={t('healthRecords.treatmentPlan')}>
                {treatmentFields.map((field, index) => (
                  <View key={field.id} style={[styles.treatmentItem, { backgroundColor: theme.colors.surfaceVariant }]}> 
                    <View style={styles.treatmentHeader}>
                      <Text style={[styles.treatmentTitle, { color: theme.colors.onSurfaceVariant }]}>#{index + 1}</Text>
                      <TouchableOpacity onPress={() => removeTreatment(index)} hitSlop={8}>
                        <MaterialCommunityIcons
                          name="close-circle-outline"
                          size={24}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>

                    <SmartInput
                      name={`treatmentPlan.${index}.name` as const}
                      label={t('healthRecords.treatmentName')}
                      placeholder={t('healthRecords.treatmentNamePlaceholder')}
                      required
                    />

                    <FormRow>
                      <SmartInput
                        name={`treatmentPlan.${index}.dosage` as const}
                        label={t('healthRecords.treatmentDosage')}
                        placeholder={t('healthRecords.treatmentDosagePlaceholder')}
                        required
                      />
                      <SmartInput
                        name={`treatmentPlan.${index}.frequency` as const}
                        label={t('healthRecords.treatmentFrequency')}
                        placeholder={t('healthRecords.treatmentFrequencyPlaceholder')}
                        required
                      />
                    </FormRow>

                    <SmartInput
                      name={`treatmentPlan.${index}.notes` as const}
                      label={t('healthRecords.treatmentInstructions')}
                      placeholder={t('healthRecords.treatmentInstructionsPlaceholder')}
                    />
                  </View>
                ))}

                <Button
                  mode="outlined"
                  onPress={() => appendTreatment({ name: '', dosage: '', frequency: '', notes: '' })}
                  icon="plus"
                  style={{ marginTop: 8 }}
                >
                  {t('healthRecords.addTreatment')}
                </Button>
              </FormSection>
            )}

            <View style={styles.actions}>
              {currentStep === 0 ? (
                <Button mode="outlined" onPress={handleCancel} disabled={isLoading} style={styles.actionButton}>
                  {t('common.cancel')}
                </Button>
              ) : (
                <Button mode="outlined" onPress={handleBackStep} disabled={isLoading} style={styles.actionButton}>
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
                <Button mode="contained" onPress={handleNextStep} disabled={isLoading} style={styles.actionButton}>
                  {t('common.next')}
                </Button>
              )}
            </View>

            {showStepError && (
              <View style={[styles.statusContainer, { backgroundColor: theme.colors.errorContainer }]}> 
                <Text style={[styles.statusText, { color: theme.colors.onErrorContainer }]}> 
                  {t('pets.pleaseFillRequiredFields')}
                </Text>
              </View>
            )}
          </KeyboardAwareView>
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
  treatmentItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  treatmentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.7,
  },
});
