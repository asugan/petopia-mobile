import { sqlite } from '@/lib/db/client';

const CREATE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS pets (
    _id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    breed TEXT,
    birth_date TEXT,
    weight REAL,
    gender TEXT,
    profile_photo TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS events (
    _id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    start_time TEXT NOT NULL,
    reminder INTEGER NOT NULL DEFAULT 0,
    reminder_preset TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming',
    vaccine_name TEXT,
    vaccine_manufacturer TEXT,
    batch_number TEXT,
    medication_name TEXT,
    dosage TEXT,
    frequency TEXT,
    recurrence_rule_id TEXT,
    series_index INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(_id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS recurrence_rules (
    _id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    reminder INTEGER NOT NULL DEFAULT 0,
    reminder_preset TEXT,
    vaccine_name TEXT,
    vaccine_manufacturer TEXT,
    batch_number TEXT,
    medication_name TEXT,
    dosage TEXT,
    frequency TEXT NOT NULL,
    interval INTEGER NOT NULL DEFAULT 1,
    days_of_week TEXT,
    day_of_month INTEGER,
    times_per_day INTEGER,
    daily_times TEXT,
    timezone TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    exception_dates TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_generated_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(_id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS feeding_schedules (
    _id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL,
    time TEXT NOT NULL,
    food_type TEXT NOT NULL,
    amount TEXT NOT NULL,
    days TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    reminders_enabled INTEGER NOT NULL DEFAULT 1,
    reminder_minutes_before INTEGER NOT NULL DEFAULT 15,
    last_notification_at TEXT,
    next_notification_time TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(_id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS health_records (
    _id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    treatment_plan TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(_id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS expenses (
    _id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT,
    date TEXT NOT NULL,
    amount_base REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES pets(_id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    base_currency TEXT NOT NULL,
    timezone TEXT NOT NULL,
    language TEXT NOT NULL,
    theme TEXT NOT NULL,
    notifications_enabled INTEGER NOT NULL DEFAULT 1,
    budget_notifications_enabled INTEGER NOT NULL DEFAULT 1,
    feeding_reminders_enabled INTEGER NOT NULL DEFAULT 1,
    quiet_hours_enabled INTEGER NOT NULL DEFAULT 1,
    quiet_hours TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS user_budget (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    alert_threshold REAL NOT NULL DEFAULT 0.8,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS budget_alert_state (
    id TEXT PRIMARY KEY NOT NULL,
    budget_id TEXT,
    last_alert_at TEXT,
    last_alert_severity TEXT,
    last_alert_percentage REAL,
    cooldown_until TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (budget_id) REFERENCES user_budget(id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT,
    updated_at TEXT NOT NULL
  );`,
  'CREATE INDEX IF NOT EXISTS idx_pets_type ON pets(type);',
  'CREATE INDEX IF NOT EXISTS idx_events_pet_id ON events(pet_id);',
  'CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);',
  'CREATE INDEX IF NOT EXISTS idx_recurrence_rules_pet_id ON recurrence_rules(pet_id);',
  'CREATE INDEX IF NOT EXISTS idx_feeding_schedules_pet_id ON feeding_schedules(pet_id);',
  'CREATE INDEX IF NOT EXISTS idx_health_records_pet_id ON health_records(pet_id);',
  'CREATE INDEX IF NOT EXISTS idx_expenses_pet_id ON expenses(pet_id);',
  'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);',
];

const OPTIONAL_ALTER_STATEMENTS = [
  'ALTER TABLE recurrence_rules ADD COLUMN exception_dates TEXT;',
];

const DROP_STATEMENTS = [
  'DROP TABLE IF EXISTS budget_alert_state;',
  'DROP TABLE IF EXISTS user_budget;',
  'DROP TABLE IF EXISTS user_settings;',
  'DROP TABLE IF EXISTS expenses;',
  'DROP TABLE IF EXISTS health_records;',
  'DROP TABLE IF EXISTS feeding_schedules;',
  'DROP TABLE IF EXISTS recurrence_rules;',
  'DROP TABLE IF EXISTS events;',
  'DROP TABLE IF EXISTS pets;',
  'DROP TABLE IF EXISTS app_meta;',
];

let initialized = false;

export const initDatabase = (): void => {
  if (initialized) {
    return;
  }

  sqlite.execSync('PRAGMA foreign_keys = ON;');
  sqlite.execSync('PRAGMA journal_mode = WAL;');

  for (const statement of CREATE_STATEMENTS) {
    sqlite.execSync(statement);
  }

  for (const statement of OPTIONAL_ALTER_STATEMENTS) {
    try {
      sqlite.execSync(statement);
    } catch {
      // Column already exists on upgraded databases.
    }
  }

  initialized = true;
};

export const resetDatabase = (): void => {
  sqlite.execSync('PRAGMA foreign_keys = OFF;');

  for (const statement of DROP_STATEMENTS) {
    sqlite.execSync(statement);
  }

  initialized = false;
  initDatabase();
};
