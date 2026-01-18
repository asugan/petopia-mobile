import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FormProvider, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, Text } from '@/components/ui';
import { useEventForm } from '@/hooks/useEventForm';
import { useTheme } from '@/lib/theme';
import { REMINDER_PRESETS, ReminderPresetKey } from '@/constants/reminders';
import { requestNotificationPermissions } from '@/lib/services/notificationService';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useAllEvents } from '@/lib/hooks/useEvents';
import { type EventFormData } from '../../lib/schemas/eventSchema';
import { Event, Pet } from '../../lib/types';
import { FormSection } from './FormSection';
import { SmartDateTimePicker } from './SmartDateTimePicker';
import { SmartDropdown } from './SmartDropdown';
import { SmartEventTypePicker } from './SmartEventTypePicker';
import { SmartInput } from './SmartInput';
import { SmartPetPicker } from './SmartPetPicker';
import { SmartSwitch } from './SmartSwitch';
import { StepHeader } from './StepHeader';
import { RecurrenceSettings } from './RecurrenceSettings';
import { showToast } from '@/lib/toast/showToast';

interface EventFormProps {
  event?: Event;
  onSubmit: (data: EventFormData) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialPetId?: string;
  pets?: Pet[];
  testID?: string;
}

export function EventForm({
  event,
  onSubmit,
  onCancel,
  loading = false,
  initialPetId,
  pets = [],
  testID,
}: EventFormProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const notificationsEnabled = useUserSettingsStore(
    (state) => state.settings?.notificationsEnabled ?? true
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const { isProUser, presentPaywall } = useSubscription();

  // Use the custom hook for form management
  const { form, control, handleSubmit, isDirty } = useEventForm(event, initialPetId);

  // Watch form values for dynamic behavior
  const eventType = useWatch({ control, name: 'type' });
  const reminderEnabled = useWatch({ control, name: 'reminder' });
  const { data: allEvents = [] } = useAllEvents();

  // Reminder limit check for free users
  const activeReminderCount = allEvents.filter((eventItem) => eventItem.reminder).length;
  const isEditingWithReminder = !!event?.reminder;
  const reminderLimitReached = !isProUser && activeReminderCount >= 2 && !isEditingWithReminder;

  const reminderPresetOptions = React.useMemo(
    () =>
      (Object.keys(REMINDER_PRESETS) as ReminderPresetKey[]).map((key) => ({
        value: key,
        label: t(REMINDER_PRESETS[key].labelKey),
      })),
    [t]
  );

  // Event type specific validation and suggestions
  const getEventTypeSuggestions = () => {
    return t(`eventForm.suggestions.${eventType || 'default'}`);
  };

  React.useEffect(() => {
    const ensureNotificationAccess = async () => {
      if (!reminderEnabled) {
        return;
      }

      if (!notificationsEnabled) {
        form.setValue('reminder', false);
        showToast({
          type: 'warning',
          title: t('settings.notifications'),
          message: t('settings.notificationDisabled'),
        });
        return;
      }

      const granted = await requestNotificationPermissions();
      if (!granted) {
        form.setValue('reminder', false);
        showToast({
          type: 'warning',
          title: t('settings.notifications'),
          message: t('settings.notificationPermissionDenied'),
        });      }
    };

    void ensureNotificationAccess();
  }, [form, notificationsEnabled, reminderEnabled, t]);

  // Handle form submission
  const onFormSubmit = React.useCallback(
    async (data: EventFormData) => {
      try {
        setIsSubmitting(true);

        await onSubmit(data);
      } catch {
        showToast({
          type: 'error',
          title: t('common.error'),
          message: t('events.saveError'),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, t]
  );

  // Form actions
  const handleCancel = React.useCallback(() => {
    if (isDirty) {
      Alert.alert(t('common.unsavedChanges'), t('common.unsavedChangesMessageShort'), [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('events.exit'),
          style: 'destructive',
          onPress: onCancel,
        },
      ]);
    } else {
      onCancel();
    }
  }, [isDirty, onCancel, t]);

  const isEditMode = !!event;

  const steps = React.useMemo(() => {
    const detailFields: (keyof EventFormData)[] = ['title', 'type', 'description'];

    if (eventType === 'vaccination') {
      detailFields.push('vaccineName');
    }

    if (eventType === 'medication') {
      detailFields.push('medicationName', 'dosage', 'frequency');
    }

    const optionFields: (keyof EventFormData)[] = ['reminder', 'notes'];
    if (reminderEnabled) {
      optionFields.push('reminderPreset');
    }

    return [
      {
        key: 'pet',
        title: t('events.steps.pet'),
        fields: ['petId'] as (keyof EventFormData)[],
      },
      {
        key: 'details',
        title: t('events.steps.details'),
        fields: detailFields,
      },
      {
        key: 'schedule',
        title: t('events.steps.schedule'),
        fields: ['startDate', 'startTime', 'endDate', 'endTime', 'location', 'isRecurring'] as (keyof EventFormData)[],
      },
      {
        key: 'options',
        title: t('events.steps.options'),
        fields: optionFields,
      },
    ];
  }, [t, eventType, reminderEnabled]);

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
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        testID={testID}
      >
        <StepHeader
          title={steps[currentStep].title}
          counterLabel={t('events.stepIndicator', { current: currentStep + 1, total: totalSteps })}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />

        {currentStep === 0 && (
          <FormSection
            title={isEditMode ? t('events.editTitle') : t('events.createTitle')}
            subtitle={t('events.createSubtitle')}
          >
            {/* Pet Selection */}
            <SmartPetPicker
              name="petId"
              required
              label={t('events.pet')}
              pets={pets}
              testID={testID ? `${testID}-pet` : 'event-form-pet'}
            />
          </FormSection>
        )}

        {currentStep === 1 && (
          <FormSection title={t('events.eventDetails')}>
            {/* Title */}
            <SmartInput
              name="title"
              required
              placeholder={t('events.titlePlaceholder')}
              label={t('events.title')}
              testID={`${testID}-title`}
            />

            {/* Event Type */}
            <SmartEventTypePicker
              name="type"
              label={t('events.type')}
              testID={testID ? `${testID}-type` : 'event-form-type'}
            />

            {/* Event type suggestions */}
            <View style={[styles.suggestionsBox, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Text
                variant="bodySmall"
                style={[styles.suggestionsText, { color: theme.colors.onSecondaryContainer }]}
              >
                💡 {getEventTypeSuggestions()}
              </Text>
            </View>

            {/* Description */}
            <SmartInput
              name="description"
              placeholder={t('events.descriptionPlaceholder')}
              label={t('events.description')}
              multiline
              numberOfLines={3}
              testID={`${testID}-description`}
            />
          </FormSection>
        )}

        {currentStep === 1 && eventType === 'vaccination' && (
          <FormSection title={t('events.vaccinationInfo')}>
            <SmartInput
              name="vaccineName"
              required
              placeholder={t('events.vaccineNamePlaceholder')}
              label={t('events.vaccineName')}
              testID={`${testID}-vaccine-name`}
            />
            <SmartInput
              name="vaccineManufacturer"
              placeholder={t('events.vaccineManufacturerPlaceholder')}
              label={t('events.vaccineManufacturer')}
              testID={`${testID}-vaccine-manufacturer`}
            />
            <SmartInput
              name="batchNumber"
              placeholder={t('events.batchNumberPlaceholder')}
              label={t('events.batchNumber')}
              testID={`${testID}-batch-number`}
            />
          </FormSection>
        )}

        {currentStep === 1 && eventType === 'medication' && (
          <FormSection title={t('events.medicationInfo')}>
            <SmartInput
              name="medicationName"
              required
              placeholder={t('events.medicationNamePlaceholder')}
              label={t('events.medicationName')}
              testID={`${testID}-medication-name`}
            />
            <SmartInput
              name="dosage"
              required
              placeholder={t('events.dosagePlaceholder')}
              label={t('events.dosage')}
              testID={`${testID}-dosage`}
            />
            <SmartInput
              name="frequency"
              required
              placeholder={t('events.frequencyPlaceholder')}
              label={t('events.frequency')}
              testID={`${testID}-frequency`}
            />
          </FormSection>
        )}

        {currentStep === 2 && (
          <FormSection title={t('common.dateTime')}>
            {/* Start DateTime */}
            <SmartDateTimePicker
              dateName="startDate"
              timeName="startTime"
              required
              label={t('events.startTime')}
              testID={`${testID}-start`}
            />

            {/* End DateTime */}
            <SmartDateTimePicker
              dateName="endDate"
              timeName="endTime"
              label={t('events.endTime')}
              testID={`${testID}-end`}
            />

            {/* Location */}
            <SmartInput
              name="location"
              placeholder={t('events.locationPlaceholder')}
              label={t('events.locationField')}
              testID={`${testID}-location`}
            />
          </FormSection>
        )}

        {/* Recurrence Settings - Step 2 */}
        {currentStep === 2 && (
          <RecurrenceSettings
            disabled={loading || isSubmitting}
            testID={`${testID}-recurrence`}
          />
        )}

        {currentStep === 3 && (
          <FormSection title={t('common.additionalOptions')}>
            {/* Reminder Switch */}
            <SmartSwitch
              name="reminder"
              label={t('events.enableReminder')}
              description={t('events.reminderDescription')}
              disabled={loading || isSubmitting || !notificationsEnabled || reminderLimitReached}
              testID={`${testID}-reminder`}
            />

            {/* Pro upgrade hint when limit reached */}
            {reminderLimitReached && (
              <View style={[styles.proHintContainer, { backgroundColor: theme.colors.secondaryContainer }]}>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSecondaryContainer }}
                >
                  {t('subscription.reminderLimitReached', 'You have reached the free reminder limit (2).')}{' '}
                  <TouchableOpacity onPress={() => void presentPaywall()}>
                    <Text
                      variant="bodySmall"
                      style={[styles.upgradeLink, { color: theme.colors.primary }]}
                    >
                      {t('subscription.upgradeToPro', 'Upgrade to Pro')}
                    </Text>
                  </TouchableOpacity>
                </Text>
              </View>
            )}

            {reminderEnabled && (
              <View style={styles.reminderPresetContainer}>
                <SmartDropdown
                  name="reminderPreset"
                  options={reminderPresetOptions}
                  placeholder={t('events.reminderPresetPlaceholder', 'Choose reminder cadence')}
                  label={t('events.reminderPresetLabel', 'Reminder cadence')}
                  required
                  testID={`${testID}-reminder-preset`}
                />
                <Text
                  variant="bodySmall"
                  style={[styles.reminderHelper, { color: theme.colors.onSurfaceVariant }]}
                >
                  {t('events.reminderPresetDescription', 'We will schedule multiple reminders automatically')}
                </Text>
              </View>
            )}

            {/* Notes */}
            <SmartInput
              name="notes"
              placeholder={t('events.notesPlaceholder')}
              multiline
              numberOfLines={3}
              maxLength={1000}
              testID={`${testID}-notes`}
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
              testID={testID ? `${testID}-cancel` : 'event-form-cancel'}
            >
              {t('common.cancel')}
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={handleBackStep}
              disabled={loading || isSubmitting}
              style={styles.actionButton}
              testID={testID ? `${testID}-back` : 'event-form-back'}
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
              testID={testID ? `${testID}-submit` : 'event-form-submit'}
            >
              {isEditMode ? t('common.update') : t('common.create')}
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleNextStep}
              disabled={loading || isSubmitting}
              style={styles.actionButton}
              testID={testID ? `${testID}-next` : 'event-form-next'}
            >
              {t('common.next')}
            </Button>
          )}
        </View>

      </ScrollView>
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
  suggestionsBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: -8, // Adjust spacing after SmartDropdown
  },
  suggestionsText: {
    lineHeight: 18,
  },
  reminderPresetContainer: {
    marginTop: 12,
    gap: 4,
  },
  reminderHelper: {
    lineHeight: 16,
  },
  proHintContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  upgradeLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
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

export default EventForm;
