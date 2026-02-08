import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Resolver, useForm, UseFormReturn } from 'react-hook-form';
import {
  eventFormSchema,
  type EventFormData,
} from '../lib/schemas/eventSchema';
import { Event } from '../lib/types';
import { toISODateString, toTimeString } from '../lib/utils/dateConversion';
import { useEventReminderStore } from '@/stores/eventReminderStore';

export type UseEventFormReturn = UseFormReturn<EventFormData> & {
  form: UseFormReturn<EventFormData>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
};

// Main hook for event form - handles both create and edit modes
export const useEventForm = (event?: Event, initialPetId?: string): UseEventFormReturn => {
  const presetSelections = useEventReminderStore(state => state.presetSelections);

  // Default values - parse datetime for date/time pickers
  const defaultValues: EventFormData = React.useMemo(() => {
    // Parse dates to local time objects
    const startDateTime = event?.startTime
      ? new Date(event.startTime)
      : new Date(Date.now() + 60000); // Now + 1 minute

    const endDateTime = event?.endTime ? new Date(event.endTime) : null;

    const startDate = toISODateString(startDateTime) || '';
    const startTime = toTimeString(startDateTime) || '';
    
    const endDate = endDateTime ? toISODateString(endDateTime) : '';
    const endTime = endDateTime ? toTimeString(endDateTime) : '';
    const presetSelection = event
      ? (presetSelections[event._id] ?? event.reminderPreset)
      : undefined;

    return {
      title: event?.title || '',
      petId: initialPetId || event?.petId || '',
      type: event?.type || 'other',
      startDate,
      startTime,
      endDate: endDate || undefined,
      endTime: endTime || undefined,
      location: event?.location || undefined,
      reminder: event?.reminder ?? false,
      reminderPreset: presetSelection ?? 'standard',
      notes: event?.notes || undefined,
      vaccineName: event?.vaccineName || undefined,
      vaccineManufacturer: event?.vaccineManufacturer || undefined,
      batchNumber: event?.batchNumber || undefined,
      medicationName: event?.medicationName || undefined,
      dosage: event?.dosage || undefined,
      frequency: event?.frequency || undefined,
      isRecurring: false,
    };
  }, [event, initialPetId, presetSelections]);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema()) as Resolver<EventFormData>,
    defaultValues,
    mode: 'onChange', // Validate on change for better UX
    reValidateMode: 'onChange',
  });

  return {
    form,
    ...form,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    isSubmitting: form.formState.isSubmitting,
  };
};

export default useEventForm;
