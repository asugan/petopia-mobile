import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const expensesTable = sqliteTable('expenses', {
  _id: text('_id').primaryKey(),
  petId: text('pet_id').notNull(),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  paymentMethod: text('payment_method'),
  date: text('date').notNull(),
  amountBase: real('amount_base'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type ExpenseRow = typeof expensesTable.$inferSelect;
