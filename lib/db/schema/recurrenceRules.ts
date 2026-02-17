import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const recurrenceRulesTable = sqliteTable('recurrence_rules', {
  _id: text('_id').primaryKey(),
  petId: text('pet_id').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  reminder: integer('reminder', { mode: 'boolean' }).notNull().default(false),
  reminderPreset: text('reminder_preset'),
  vaccineName: text('vaccine_name'),
  vaccineManufacturer: text('vaccine_manufacturer'),
  batchNumber: text('batch_number'),
  medicationName: text('medication_name'),
  dosage: text('dosage'),
  frequency: text('frequency').notNull(),
  interval: integer('interval').notNull().default(1),
  daysOfWeek: text('days_of_week'),
  dayOfMonth: integer('day_of_month'),
  timesPerDay: integer('times_per_day'),
  dailyTimes: text('daily_times'),
  timezone: text('timezone').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  exceptionDates: text('exception_dates'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastGeneratedDate: text('last_generated_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type RecurrenceRuleRow = typeof recurrenceRulesTable.$inferSelect;
