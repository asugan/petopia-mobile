import { describe, expect, it } from 'vitest';

import { HealthRecordCreateSchema, HealthRecordUpdateSchema } from '@/lib/schemas/healthRecordSchema';

describe('healthRecordSchema', () => {
  it('accepts minimal valid create payload', () => {
    const result = HealthRecordCreateSchema().safeParse({
      petId: '507f1f77bcf86cd799439011',
      type: 'checkup',
      title: 'General checkup',
      date: new Date(),
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid treatmentPlan item', () => {
    const result = HealthRecordCreateSchema().safeParse({
      petId: '507f1f77bcf86cd799439011',
      type: 'checkup',
      title: 'General checkup',
      date: new Date(),
      treatmentPlan: [
        {
          name: '',
          dosage: '1 tablet',
          frequency: 'Twice a day',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid treatmentPlan', () => {
    const result = HealthRecordCreateSchema().safeParse({
      petId: '507f1f77bcf86cd799439011',
      type: 'visit',
      title: 'Treatment follow-up',
      date: new Date(),
      treatmentPlan: [
        {
          name: 'Antibiotics',
          dosage: '1 tablet',
          frequency: 'Twice a day',
          notes: 'With food',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts partial update payload', () => {
    const result = HealthRecordUpdateSchema().safeParse({
      title: 'Updated title',
    });

    expect(result.success).toBe(true);
  });
});
