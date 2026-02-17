import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const feedingSchedulesTable = sqliteTable('feeding_schedules', {
  _id: text('_id').primaryKey(),
  petId: text('pet_id').notNull(),
  time: text('time').notNull(),
  foodType: text('food_type').notNull(),
  amount: text('amount').notNull(),
  days: text('days').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  remindersEnabled: integer('reminders_enabled', { mode: 'boolean' }).notNull().default(true),
  reminderMinutesBefore: integer('reminder_minutes_before').notNull().default(15),
  lastNotificationAt: text('last_notification_at'),
  nextNotificationTime: text('next_notification_time'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type FeedingScheduleRow = typeof feedingSchedulesTable.$inferSelect;
