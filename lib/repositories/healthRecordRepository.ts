import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { initDatabase } from '@/lib/db/init';
import { createObjectId, nowIsoString } from '@/lib/db/utils';
import { healthRecordsTable, type HealthRecordRow } from '@/lib/db/schema/healthRecords';
import type { CreateHealthRecordInput, HealthRecord, UpdateHealthRecordInput } from '@/lib/types';
import { normalizeToISOString } from '@/lib/utils/dateConversion';

const mapRowToHealthRecord = (row: HealthRecordRow): HealthRecord => {
  let treatmentPlan: HealthRecord['treatmentPlan'];

  if (row.treatmentPlan) {
    try {
      treatmentPlan = JSON.parse(row.treatmentPlan) as HealthRecord['treatmentPlan'];
    } catch {
      treatmentPlan = undefined;
    }
  }

  return {
    _id: row._id,
    petId: row.petId,
    type: row.type,
    title: row.title,
    date: row.date,
    treatmentPlan,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export class HealthRecordRepository {
  constructor() {
    initDatabase();
  }

  getHealthRecords(): HealthRecord[] {
    const rows = db.select().from(healthRecordsTable).all();
    return rows.map(mapRowToHealthRecord);
  }

  getHealthRecordsByPetId(petId: string): HealthRecord[] {
    const rows = db
      .select()
      .from(healthRecordsTable)
      .where(eq(healthRecordsTable.petId, petId))
      .all();

    return rows.map(mapRowToHealthRecord);
  }

  getHealthRecordById(id: string): HealthRecord | null {
    const row = db
      .select()
      .from(healthRecordsTable)
      .where(eq(healthRecordsTable._id, id))
      .get();

    return row ? mapRowToHealthRecord(row) : null;
  }

  createHealthRecord(data: CreateHealthRecordInput): HealthRecord {
    const now = nowIsoString();
    const _id = createObjectId();

    db.insert(healthRecordsTable)
      .values({
        _id,
        petId: data.petId,
        type: data.type,
        title: data.title,
        date: normalizeToISOString(data.date) ?? now,
        treatmentPlan: data.treatmentPlan ? JSON.stringify(data.treatmentPlan) : null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = this.getHealthRecordById(_id);

    if (!created) {
      throw new Error('Failed to create health record');
    }

    return created;
  }

  updateHealthRecord(id: string, data: UpdateHealthRecordInput): HealthRecord | null {
    const updates: Partial<typeof healthRecordsTable.$inferInsert> = {
      updatedAt: nowIsoString(),
    };

    if (typeof data.type !== 'undefined') {
      updates.type = data.type;
    }

    if (typeof data.title !== 'undefined') {
      updates.title = data.title;
    }

    if (typeof data.date !== 'undefined') {
      updates.date = normalizeToISOString(data.date) ?? nowIsoString();
    }

    if (typeof data.treatmentPlan !== 'undefined') {
      updates.treatmentPlan = data.treatmentPlan ? JSON.stringify(data.treatmentPlan) : null;
    }

    const result = db
      .update(healthRecordsTable)
      .set(updates)
      .where(eq(healthRecordsTable._id, id))
      .run();

    if (result.changes === 0) {
      return null;
    }

    return this.getHealthRecordById(id);
  }

  deleteHealthRecord(id: string): boolean {
    const result = db.delete(healthRecordsTable).where(eq(healthRecordsTable._id, id)).run();
    return result.changes > 0;
  }
}

export const healthRecordRepository = new HealthRecordRepository();
