import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const eventsTable = sqliteTable('events', {
  _id: text('_id').primaryKey(),
  petId: text('pet_id').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  startTime: text('start_time').notNull(),
  reminder: integer('reminder', { mode: 'boolean' }).notNull().default(false),
  reminderPreset: text('reminder_preset'),
  status: text('status').notNull().default('upcoming'),
  vaccineName: text('vaccine_name'),
  vaccineManufacturer: text('vaccine_manufacturer'),
  batchNumber: text('batch_number'),
  medicationName: text('medication_name'),
  dosage: text('dosage'),
  frequency: text('frequency'),
  recurrenceRuleId: text('recurrence_rule_id'),
  seriesIndex: integer('series_index'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type EventRow = typeof eventsTable.$inferSelect;
