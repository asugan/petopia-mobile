import { describe, expect, it } from 'vitest';

import { HealthRecordCreateSchema, HealthRecordUpdateSchema } from '@/lib/schemas/healthRecordSchema';

describe('healthRecordSchema', () => {
  it('transforms nextVisitDate Date into UTC ISO string on create', () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);

    const result = HealthRecordCreateSchema().safeParse({
      petId: '507f1f77bcf86cd799439011',
      type: 'checkup',
      title: 'Vet checkup',
      description: 'Routine',
      date: new Date(),
      nextVisitDate: now,
      veterinarian: 'Dr X',
      clinic: 'Clinic',
      notes: 'N/A',
      cost: 10,
      treatmentPlan: [],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(typeof result.data.nextVisitDate).toBe('string');
    expect(result.data.nextVisitDate).toContain('T');
  });

  it('allows nextVisitDate null on update', () => {
    const result = HealthRecordUpdateSchema().safeParse({
      nextVisitDate: null,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.nextVisitDate).toBeNull();
  });
});
