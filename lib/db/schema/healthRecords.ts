import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const healthRecordsTable = sqliteTable('health_records', {
  _id: text('_id').primaryKey(),
  petId: text('pet_id').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  treatmentPlan: text('treatment_plan'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type HealthRecordRow = typeof healthRecordsTable.$inferSelect;
