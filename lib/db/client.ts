import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/lib/db/schema';

export const DATABASE_NAME = 'petopia.db';

export const sqlite = openDatabaseSync(DATABASE_NAME);

export const db = drizzle(sqlite, { schema });

export type LocalDatabase = typeof db;
