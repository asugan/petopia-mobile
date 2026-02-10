import { describe, expect, it, vi } from 'vitest';

vi.mock('@/constants', () => ({
  EVENT_TYPES: {
    FEEDING: 'feeding',
    EXERCISE: 'exercise',
    GROOMING: 'grooming',
    PLAY: 'play',
    TRAINING: 'training',
    VET_VISIT: 'vet_visit',
    WALK: 'walk',
    BATH: 'bath',
    VACCINATION: 'vaccination',
    MEDICATION: 'medication',
    OTHER: 'other',
  },
}));
import {
  EVENT_TYPES,
  transformFormDataToAPI,
  type EventFormData,
} from '@/lib/schemas/eventSchema';

describe('eventSchema timezone transform', () => {
  it('transforms startDate/startTime using provided timezone', () => {
    const formData: EventFormData = {
      title: 'Vet Visit',
      petId: '507f1f77bcf86cd799439011',
      type: EVENT_TYPES.VET_VISIT,
      startDate: '2026-02-04',
      startTime: '10:00',
      reminder: false,
      reminderPreset: 'standard',
      vaccineName: undefined,
      vaccineManufacturer: undefined,
      batchNumber: undefined,
      medicationName: undefined,
      dosage: undefined,
      frequency: undefined,
      isRecurring: false,
    };

    const apiData = transformFormDataToAPI(formData, 'Europe/Istanbul');

    expect(apiData.startTime).toBe('2026-02-04T07:00:00.000Z');
  });
});
