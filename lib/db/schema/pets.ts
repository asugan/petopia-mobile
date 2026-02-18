import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const petsTable = sqliteTable('pets', {
  _id: text('_id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  breed: text('breed'),
  birthDate: text('birth_date'),
  weight: real('weight'),
  gender: text('gender'),
  profilePhoto: text('profile_photo'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type PetRow = typeof petsTable.$inferSelect;
export type NewPetRow = typeof petsTable.$inferInsert;
