import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { initDatabase } from '@/lib/db/init';
import { nowIsoString } from '@/lib/db/utils';
import { userSettingsTable, type UserSettingsRow } from '@/lib/db/schema/userSettings';
import type { SupportedCurrency, UserSettings, UserSettingsUpdate } from '@/lib/types';
import { detectDeviceTimezone } from '@/lib/utils/timezone';

const LOCAL_SETTINGS_ID = 'local-settings';
const LOCAL_USER_ID = 'local-user';

const defaultQuietHours = {
  startHour: 22,
  startMinute: 0,
  endHour: 8,
  endMinute: 0,
};

const mapRowToSettings = (row: UserSettingsRow): UserSettings => {
  let quietHours = defaultQuietHours;

  try {
    const parsed = JSON.parse(row.quietHours) as UserSettings['quietHours'];
    if (parsed && typeof parsed === 'object') {
      quietHours = parsed;
    }
  } catch {
    quietHours = defaultQuietHours;
  }

  return {
    id: row.id,
    userId: row.userId,
    baseCurrency: row.baseCurrency as SupportedCurrency,
    timezone: row.timezone,
    language: row.language as UserSettings['language'],
    theme: row.theme as UserSettings['theme'],
    notificationsEnabled: row.notificationsEnabled,
    budgetNotificationsEnabled: row.budgetNotificationsEnabled,
    feedingRemindersEnabled: row.feedingRemindersEnabled,
    quietHoursEnabled: row.quietHoursEnabled,
    quietHours,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const createDefaultSettings = (): UserSettings => {
  const now = nowIsoString();

  return {
    id: LOCAL_SETTINGS_ID,
    userId: LOCAL_USER_ID,
    baseCurrency: 'USD',
    timezone: detectDeviceTimezone(),
    language: 'en',
    theme: 'dark',
    notificationsEnabled: true,
    budgetNotificationsEnabled: true,
    feedingRemindersEnabled: true,
    quietHoursEnabled: true,
    quietHours: defaultQuietHours,
    createdAt: now,
    updatedAt: now,
  };
};

export class UserSettingsRepository {
  constructor() {
    initDatabase();
  }

  getSettings(): UserSettings {
    const row = db
      .select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.id, LOCAL_SETTINGS_ID))
      .get();

    if (row) {
      return mapRowToSettings(row);
    }

    const defaults = createDefaultSettings();

    db.insert(userSettingsTable)
      .values({
        id: defaults.id,
        userId: defaults.userId,
        baseCurrency: defaults.baseCurrency,
        timezone: defaults.timezone,
        language: defaults.language,
        theme: defaults.theme,
        notificationsEnabled: defaults.notificationsEnabled,
        budgetNotificationsEnabled: defaults.budgetNotificationsEnabled,
        feedingRemindersEnabled: defaults.feedingRemindersEnabled,
        quietHoursEnabled: defaults.quietHoursEnabled,
        quietHours: JSON.stringify(defaults.quietHours),
        createdAt: defaults.createdAt,
        updatedAt: defaults.updatedAt,
      })
      .run();

    return defaults;
  }

  updateSettings(updates: UserSettingsUpdate): UserSettings {
    const current = this.getSettings();
    const updatedAt = nowIsoString();

    const nextQuietHours = updates.quietHours ?? current.quietHours;

    db.update(userSettingsTable)
      .set({
        baseCurrency: updates.baseCurrency ?? current.baseCurrency,
        timezone: updates.timezone ?? current.timezone,
        language: updates.language ?? current.language,
        theme: updates.theme ?? current.theme,
        notificationsEnabled: updates.notificationsEnabled ?? current.notificationsEnabled,
        budgetNotificationsEnabled:
          updates.budgetNotificationsEnabled ?? current.budgetNotificationsEnabled,
        feedingRemindersEnabled:
          updates.feedingRemindersEnabled ?? current.feedingRemindersEnabled,
        quietHoursEnabled: updates.quietHoursEnabled ?? current.quietHoursEnabled,
        quietHours: JSON.stringify(nextQuietHours),
        updatedAt,
      })
      .where(eq(userSettingsTable.id, LOCAL_SETTINGS_ID))
      .run();

    return this.getSettings();
  }

  updateBaseCurrency(currency: SupportedCurrency): UserSettings {
    return this.updateSettings({ baseCurrency: currency });
  }
}

export const userSettingsRepository = new UserSettingsRepository();
