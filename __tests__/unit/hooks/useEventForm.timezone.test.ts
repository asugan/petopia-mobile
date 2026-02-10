// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useEventForm } from '@/hooks/useEventForm';
import type { Event } from '@/lib/types';

const { mockedUseForm } = vi.hoisted(() => ({
  mockedUseForm: vi.fn(() => ({
    control: {},
    formState: {
      isDirty: false,
      isValid: false,
      isSubmitting: false,
    },
  })),
}));

vi.mock('react-hook-form', () => ({
  useForm: mockedUseForm,
}));

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

vi.mock('@/lib/hooks/useUserTimezone', () => ({
  useUserTimezone: () => 'Europe/Istanbul',
}));

vi.mock('@/stores/eventReminderStore', () => ({
  useEventReminderStore: (selector: (state: { presetSelections: Record<string, 'standard' | 'compact' | 'minimal'> }) => unknown) =>
    selector({ presetSelections: {} }),
}));

const createEvent = (overrides: Partial<Event> = {}): Event => ({
  _id: 'event-1',
  petId: '507f1f77bcf86cd799439011',
  title: 'Late Night Event',
  type: 'vet_visit',
  startTime: '2026-02-03T21:30:00.000Z',
  status: 'upcoming',
  reminder: false,
  reminderPreset: 'standard',
  createdAt: '2026-02-03T20:00:00.000Z',
  updatedAt: '2026-02-03T20:00:00.000Z',
  ...overrides,
});

describe('useEventForm timezone defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes edit form date/time in user timezone', () => {
    const event = createEvent();

    renderHook(() => useEventForm(event));

    const useFormCall = vi.mocked(useForm).mock.calls[0]?.[0] as {
      defaultValues?: {
        startDate?: string;
        startTime?: string;
      };
    };

    expect(useFormCall.defaultValues?.startDate).toBe('2026-02-04');
    expect(useFormCall.defaultValues?.startTime).toBe('00:30');
  });
});
