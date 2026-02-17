import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const userSettingsTable = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  baseCurrency: text('base_currency').notNull(),
  timezone: text('timezone').notNull(),
  language: text('language').notNull(),
  theme: text('theme').notNull(),
  notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' }).notNull().default(true),
  budgetNotificationsEnabled: integer('budget_notifications_enabled', { mode: 'boolean' }).notNull().default(true),
  feedingRemindersEnabled: integer('feeding_reminders_enabled', { mode: 'boolean' }).notNull().default(true),
  quietHoursEnabled: integer('quiet_hours_enabled', { mode: 'boolean' }).notNull().default(true),
  quietHours: text('quiet_hours').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type UserSettingsRow = typeof userSettingsTable.$inferSelect;
