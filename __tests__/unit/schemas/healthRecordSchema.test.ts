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
    expect(result.data.nextVisitDate).toMatch(/Z$/);
  });

  it('rejects nextVisitDate in the past on create', () => {
    const pastDate = new Date();
    pastDate.setMinutes(pastDate.getMinutes() - 10);

    const result = HealthRecordCreateSchema().safeParse({
      petId: '507f1f77bcf86cd799439011',
      type: 'checkup',
      title: 'Vet checkup',
      date: new Date(),
      nextVisitDate: pastDate,
    });

    expect(result.success).toBe(false);
  });

  it('allows undefined nextVisitDate on create', () => {
    const result = HealthRecordCreateSchema().safeParse({
      petId: '507f1f77bcf86cd799439011',
      type: 'checkup',
      title: 'Vet checkup',
      date: new Date(),
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.nextVisitDate).toBeUndefined();
  });

  it('accepts nextVisitDate as UTC ISO string on create', () => {
    const result = HealthRecordCreateSchema().safeParse({
      petId: '507f1f77bcf86cd799439011',
      type: 'checkup',
      title: 'Vet checkup',
      date: new Date(),
      nextVisitDate: '2100-01-01T10:00:00.000Z',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.nextVisitDate).toBe('2100-01-01T10:00:00.000Z');
  });

  it('transforms nextVisitDate string without timezone into UTC ISO string on create', () => {
    const result = HealthRecordCreateSchema().safeParse({
      petId: '507f1f77bcf86cd799439011',
      type: 'checkup',
      title: 'Vet checkup',
      date: new Date(),
      nextVisitDate: '2100-01-01T10:00:00',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(typeof result.data.nextVisitDate).toBe('string');
    expect(result.data.nextVisitDate).toContain('T');
    expect(result.data.nextVisitDate).toMatch(/Z$/);
  });

  it('rejects invalid treatmentPlan item on create', () => {
    const result = HealthRecordCreateSchema().safeParse({
      petId: '507f1f77bcf86cd799439011',
      type: 'checkup',
      title: 'Vet checkup',
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

  it('accepts valid treatmentPlan on create', () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);

    const result = HealthRecordCreateSchema().safeParse({
      petId: '507f1f77bcf86cd799439011',
      type: 'checkup',
      title: 'Vet checkup',
      date: new Date(),
      nextVisitDate: now,
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

  it('allows nextVisitDate null on update', () => {
    const result = HealthRecordUpdateSchema().safeParse({
      nextVisitDate: null,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.nextVisitDate).toBeNull();
  });
});
