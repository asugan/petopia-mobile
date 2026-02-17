import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const userBudgetTable = sqliteTable('user_budget', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  alertThreshold: real('alert_threshold').notNull().default(0.8),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const budgetAlertStateTable = sqliteTable('budget_alert_state', {
  id: text('id').primaryKey(),
  budgetId: text('budget_id'),
  lastAlertAt: text('last_alert_at'),
  lastAlertSeverity: text('last_alert_severity'),
  lastAlertPercentage: real('last_alert_percentage'),
  cooldownUntil: text('cooldown_until'),
  updatedAt: text('updated_at').notNull(),
});

export type UserBudgetRow = typeof userBudgetTable.$inferSelect;
export type BudgetAlertStateRow = typeof budgetAlertStateTable.$inferSelect;
