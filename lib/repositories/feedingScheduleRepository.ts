import { addDays } from 'date-fns';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { initDatabase } from '@/lib/db/init';
import { createObjectId, nowIsoString } from '@/lib/db/utils';
import {
  feedingSchedulesTable,
  type FeedingScheduleRow,
} from '@/lib/db/schema/feedingSchedules';
import {
  normalizeFeedingDays,
  type DayOfWeek,
  type FeedingSchedule,
} from '@/lib/schemas/feedingScheduleSchema';
import type { CreateFeedingScheduleInput, UpdateFeedingScheduleInput } from '@/lib/types';
import { resolveEffectiveTimezone } from '@/lib/utils/timezone';
import { toLocalDateKey } from '@/lib/utils/timezoneDate';

const ISO_DAY_TO_NAME: Record<number, DayOfWeek> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  7: 'sunday',
};

const parseDays = (days: string): DayOfWeek[] => {
  try {
    const parsed = JSON.parse(days) as string[];
    if (Array.isArray(parsed)) {
      return normalizeFeedingDays(parsed);
    }
  } catch {
    return normalizeFeedingDays(days);
  }

  return normalizeFeedingDays(days);
};

const mapRowToFeedingSchedule = (row: FeedingScheduleRow): FeedingSchedule => ({
  _id: row._id,
  petId: row.petId,
  time: row.time,
  foodType: row.foodType,
  amount: row.amount,
  days: parseDays(row.days),
  isActive: row.isActive,
  remindersEnabled: row.remindersEnabled,
  reminderMinutesBefore: row.reminderMinutesBefore,
  lastNotificationAt: row.lastNotificationAt ?? undefined,
  nextNotificationTime: row.nextNotificationTime ?? undefined,
  createdAt: row.createdAt,
});

const includesDay = (schedule: FeedingSchedule, day: DayOfWeek): boolean => {
  return normalizeFeedingDays(schedule.days).includes(day);
};

const getNextOccurrence = (
  schedule: FeedingSchedule,
  timezone: string,
  now: Date,
): Date | null => {
  for (let offset = 0; offset <= 7; offset += 1) {
    const targetDate = addDays(now, offset);
    const isoDay = Number(formatInTimeZone(targetDate, timezone, 'i'));
    const dayName = ISO_DAY_TO_NAME[isoDay];

    if (!dayName || !includesDay(schedule, dayName)) {
      continue;
    }

    const dateKey = toLocalDateKey(targetDate, timezone);
    if (!dateKey) {
      continue;
    }

    const candidate = fromZonedTime(`${dateKey}T${schedule.time}:00`, timezone);
    if (offset === 0 && candidate <= now) {
      continue;
    }

    return candidate;
  }

  return null;
};

export class FeedingScheduleRepository {
  constructor() {
    initDatabase();
  }

  getFeedingSchedules(): FeedingSchedule[] {
    const rows = db.select().from(feedingSchedulesTable).all();
    return rows.map(mapRowToFeedingSchedule);
  }

  getFeedingSchedulesByPetId(petId: string): FeedingSchedule[] {
    const rows = db
      .select()
      .from(feedingSchedulesTable)
      .where(eq(feedingSchedulesTable.petId, petId))
      .all();

    return rows.map(mapRowToFeedingSchedule);
  }

  getFeedingScheduleById(id: string): FeedingSchedule | null {
    const row = db
      .select()
      .from(feedingSchedulesTable)
      .where(eq(feedingSchedulesTable._id, id))
      .get();

    return row ? mapRowToFeedingSchedule(row) : null;
  }

  createFeedingSchedule(data: CreateFeedingScheduleInput): FeedingSchedule {
    const now = nowIsoString();
    const _id = createObjectId();
    const normalizedDays = normalizeFeedingDays(data.days);

    db.insert(feedingSchedulesTable)
      .values({
        _id,
        petId: data.petId,
        time: data.time,
        foodType: data.foodType,
        amount: data.amount,
        days: JSON.stringify(normalizedDays),
        isActive: data.isActive ?? true,
        remindersEnabled: true,
        reminderMinutesBefore: 15,
        lastNotificationAt: null,
        nextNotificationTime: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = this.getFeedingScheduleById(_id);
    if (!created) {
      throw new Error('Failed to create feeding schedule');
    }

    return created;
  }

  updateFeedingSchedule(
    id: string,
    data: UpdateFeedingScheduleInput,
  ): FeedingSchedule | null {
    const updates: Partial<typeof feedingSchedulesTable.$inferInsert> = {
      updatedAt: nowIsoString(),
    };

    if (typeof data.time !== 'undefined') {
      updates.time = data.time;
    }

    if (typeof data.foodType !== 'undefined') {
      updates.foodType = data.foodType;
    }

    if (typeof data.amount !== 'undefined') {
      updates.amount = data.amount;
    }

    if (typeof data.days !== 'undefined') {
      updates.days = JSON.stringify(normalizeFeedingDays(data.days));
    }

    if (typeof data.isActive !== 'undefined') {
      updates.isActive = data.isActive;
      updates.remindersEnabled = data.isActive;
    }

    const result = db
      .update(feedingSchedulesTable)
      .set(updates)
      .where(eq(feedingSchedulesTable._id, id))
      .run();

    if (result.changes === 0) {
      return null;
    }

    return this.getFeedingScheduleById(id);
  }

  deleteFeedingSchedule(id: string): boolean {
    const result = db
      .delete(feedingSchedulesTable)
      .where(eq(feedingSchedulesTable._id, id))
      .run();

    return result.changes > 0;
  }

  getActiveFeedingSchedules(): FeedingSchedule[] {
    return this.getFeedingSchedules().filter((schedule) => schedule.isActive);
  }

  getTodayFeedingSchedules(timezone?: string): FeedingSchedule[] {
    const tz = resolveEffectiveTimezone(timezone);
    const now = new Date();
    const todayIsoDay = Number(formatInTimeZone(now, tz, 'i'));
    const today = ISO_DAY_TO_NAME[todayIsoDay];

    if (!today) {
      return [];
    }

    return this.getActiveFeedingSchedules().filter((schedule) => includesDay(schedule, today));
  }

  getNextFeeding(timezone?: string): FeedingSchedule | null {
    const tz = resolveEffectiveTimezone(timezone);
    const now = new Date();

    let nextSchedule: FeedingSchedule | null = null;
    let nextDate: Date | null = null;

    for (const schedule of this.getActiveFeedingSchedules()) {
      const occurrence = getNextOccurrence(schedule, tz, now);
      if (!occurrence) {
        continue;
      }

      if (!nextDate || occurrence < nextDate) {
        nextDate = occurrence;
        nextSchedule = schedule;
      }
    }

    return nextSchedule;
  }

  getActiveFeedingSchedulesByPet(petId: string): FeedingSchedule[] {
    return this.getFeedingSchedulesByPetId(petId).filter((schedule) => schedule.isActive);
  }
}

export const feedingScheduleRepository = new FeedingScheduleRepository();
