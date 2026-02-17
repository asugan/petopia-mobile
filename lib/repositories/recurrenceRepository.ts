import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { eq } from 'drizzle-orm';
import { generateDailyTimes } from '@/constants/recurrence';
import { db } from '@/lib/db/client';
import { initDatabase } from '@/lib/db/init';
import { createObjectId, nowIsoString } from '@/lib/db/utils';
import { eventsTable, type EventRow } from '@/lib/db/schema/events';
import {
  recurrenceRulesTable,
  type RecurrenceRuleRow,
} from '@/lib/db/schema/recurrenceRules';
import type {
  RecurrenceRule,
  RecurrenceRuleData,
  UpdateRecurrenceRuleData,
} from '@/lib/schemas/recurrenceSchema';
import type { Event } from '@/lib/types';
import { resolveEffectiveTimezone } from '@/lib/utils/timezone';

const LOCAL_USER_ID = 'local-user';
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_GENERATED_EVENTS = 240;

const toIsoDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseJsonArray = <T>(raw: string | null): T[] | undefined => {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const mapRuleRowToRule = (row: RecurrenceRuleRow): RecurrenceRule => ({
  _id: row._id,
  userId: LOCAL_USER_ID,
  petId: row.petId,
  title: row.title,
  type: row.type as RecurrenceRule['type'],
  reminder: row.reminder,
  reminderPreset:
    row.reminderPreset === 'standard' ||
    row.reminderPreset === 'compact' ||
    row.reminderPreset === 'minimal'
      ? row.reminderPreset
      : undefined,
  vaccineName: row.vaccineName ?? undefined,
  vaccineManufacturer: row.vaccineManufacturer ?? undefined,
  batchNumber: row.batchNumber ?? undefined,
  medicationName: row.medicationName ?? undefined,
  dosage: row.dosage ?? undefined,
  frequency: row.frequency as RecurrenceRule['frequency'],
  interval: row.interval,
  daysOfWeek: parseJsonArray<number>(row.daysOfWeek),
  dayOfMonth: typeof row.dayOfMonth === 'number' ? row.dayOfMonth : undefined,
  timesPerDay: typeof row.timesPerDay === 'number' ? row.timesPerDay : undefined,
  dailyTimes: parseJsonArray<string>(row.dailyTimes),
  timezone: row.timezone,
  startDate: row.startDate,
  endDate: row.endDate ?? undefined,
  exceptionDates: parseJsonArray<string>(row.exceptionDates),
  isActive: row.isActive,
  lastGeneratedDate: row.lastGeneratedDate ?? undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const mapEventRowToEvent = (row: EventRow): Event => ({
  _id: row._id,
  petId: row.petId,
  title: row.title,
  type: row.type,
  startTime: row.startTime,
  reminder: row.reminder,
  reminderPreset:
    row.reminderPreset === 'standard' ||
    row.reminderPreset === 'compact' ||
    row.reminderPreset === 'minimal'
      ? row.reminderPreset
      : undefined,
  vaccineName: row.vaccineName ?? undefined,
  vaccineManufacturer: row.vaccineManufacturer ?? undefined,
  batchNumber: row.batchNumber ?? undefined,
  medicationName: row.medicationName ?? undefined,
  dosage: row.dosage ?? undefined,
  frequency: row.frequency ?? undefined,
  status: row.status as Event['status'],
  recurrenceRuleId: row.recurrenceRuleId ?? undefined,
  seriesIndex: typeof row.seriesIndex === 'number' ? row.seriesIndex : undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const clampDate = (date: Date, min: Date, max: Date): Date => {
  if (date < min) {
    return min;
  }
  if (date > max) {
    return max;
  }
  return date;
};

const buildDateRange = (rule: RecurrenceRule): { start: Date; end: Date } => {
  const timezone = resolveEffectiveTimezone(rule.timezone);
  const todayKey = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  const startKey = formatInTimeZone(rule.startDate, timezone, 'yyyy-MM-dd');

  const startDate = new Date(`${startKey}T00:00:00.000Z`);
  const todayDate = new Date(`${todayKey}T00:00:00.000Z`);
  const generationStart = startDate > todayDate ? startDate : todayDate;

  const horizonEnd = addDays(generationStart, 180);
  const endDate = rule.endDate
    ? new Date(`${formatInTimeZone(rule.endDate, timezone, 'yyyy-MM-dd')}T23:59:59.999Z`)
    : horizonEnd;

  return {
    start: generationStart,
    end: clampDate(endDate, generationStart, horizonEnd),
  };
};

const getWeeklyDay = (date: Date): number => {
  return date.getUTCDay();
};

const generateOccurrenceDateKeys = (rule: RecurrenceRule): string[] => {
  const interval = Math.max(rule.interval ?? 1, 1);
  const { start, end } = buildDateRange(rule);
  const occurrences: string[] = [];

  if (rule.frequency === 'weekly') {
    const selectedDays =
      rule.daysOfWeek && rule.daysOfWeek.length > 0
        ? new Set(rule.daysOfWeek)
        : new Set([getWeeklyDay(start)]);

    for (let date = new Date(start); date <= end; date = new Date(date.getTime() + DAY_MS)) {
      const dayDiff = Math.floor((date.getTime() - start.getTime()) / DAY_MS);
      const weekIndex = Math.floor(dayDiff / 7);
      if (weekIndex % interval !== 0) {
        continue;
      }

      if (!selectedDays.has(getWeeklyDay(date))) {
        continue;
      }

      occurrences.push(toIsoDateKey(date));
      if (occurrences.length >= MAX_GENERATED_EVENTS) {
        break;
      }
    }

    return occurrences;
  }

  if (rule.frequency === 'monthly') {
    const dayOfMonth = Math.max(rule.dayOfMonth ?? start.getUTCDate(), 1);
    let cursorYear = start.getUTCFullYear();
    let cursorMonth = start.getUTCMonth();

    while (true) {
      const monthStart = new Date(Date.UTC(cursorYear, cursorMonth, 1));
      if (monthStart > end) {
        break;
      }

      const nextMonth = new Date(Date.UTC(cursorYear, cursorMonth + 1, 1));
      const lastDay = new Date(nextMonth.getTime() - DAY_MS).getUTCDate();
      const targetDay = Math.min(dayOfMonth, lastDay);
      const candidate = new Date(Date.UTC(cursorYear, cursorMonth, targetDay));

      if (candidate >= start && candidate <= end) {
        occurrences.push(toIsoDateKey(candidate));
        if (occurrences.length >= MAX_GENERATED_EVENTS) {
          break;
        }
      }

      cursorMonth += interval;
      while (cursorMonth > 11) {
        cursorYear += 1;
        cursorMonth -= 12;
      }
    }

    return occurrences;
  }

  if (rule.frequency === 'yearly') {
    const startMonth = start.getUTCMonth();
    const startDay = start.getUTCDate();
    let year = start.getUTCFullYear();

    while (true) {
      const candidate = new Date(Date.UTC(year, startMonth, startDay));
      if (candidate > end) {
        break;
      }

      if (candidate >= start) {
        occurrences.push(toIsoDateKey(candidate));
        if (occurrences.length >= MAX_GENERATED_EVENTS) {
          break;
        }
      }

      year += interval;
    }

    return occurrences;
  }

  for (let date = new Date(start); date <= end; date = new Date(date.getTime() + interval * DAY_MS)) {
    occurrences.push(toIsoDateKey(date));
    if (occurrences.length >= MAX_GENERATED_EVENTS) {
      break;
    }
  }

  return occurrences;
};

const generateEventStartTimes = (rule: RecurrenceRule): string[] => {
  const timezone = resolveEffectiveTimezone(rule.timezone);
  const dateKeys = generateOccurrenceDateKeys(rule);
  const exceptionDateSet = new Set(rule.exceptionDates ?? []);
  const configuredTimes =
    rule.dailyTimes && rule.dailyTimes.length > 0
      ? rule.dailyTimes
      : generateDailyTimes(rule.timesPerDay ?? 1);

  const times = configuredTimes.length > 0 ? configuredTimes : ['09:00'];
  const result: string[] = [];

  for (const dateKey of dateKeys) {
    if (exceptionDateSet.has(dateKey)) {
      continue;
    }

    for (const time of times) {
      result.push(fromZonedTime(`${dateKey}T${time}:00`, timezone).toISOString());
      if (result.length >= MAX_GENERATED_EVENTS) {
        return result;
      }
    }
  }

  return result;
};

export class RecurrenceRepository {
  constructor() {
    initDatabase();
  }

  getRules(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    petId?: string;
  }): RecurrenceRule[] {
    const rows = db.select().from(recurrenceRulesTable).all();

    let rules = rows.map(mapRuleRowToRule);
    if (typeof params?.isActive === 'boolean') {
      rules = rules.filter((rule) => rule.isActive === params.isActive);
    }
    if (params?.petId) {
      rules = rules.filter((rule) => rule.petId === params.petId);
    }

    rules = rules.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const page = Math.max(params?.page ?? 1, 1);
    const fallbackLimit = rules.length > 0 ? rules.length : 1;
    const limit = Math.max(params?.limit ?? fallbackLimit, 1);
    const offset = (page - 1) * limit;

    return rules.slice(offset, offset + limit);
  }

  getRuleById(id: string): RecurrenceRule | null {
    const row = db
      .select()
      .from(recurrenceRulesTable)
      .where(eq(recurrenceRulesTable._id, id))
      .get();

    return row ? mapRuleRowToRule(row) : null;
  }

  private generateEventsForRule(rule: RecurrenceRule): number {
    const startTimes = generateEventStartTimes(rule);
    const now = nowIsoString();

    let created = 0;
    startTimes.forEach((startTime, index) => {
      db.insert(eventsTable)
        .values({
          _id: createObjectId(),
          petId: rule.petId,
          title: rule.title,
          type: rule.type,
          startTime,
          reminder: rule.reminder,
          reminderPreset: rule.reminderPreset ?? null,
          status: 'upcoming',
          vaccineName: rule.vaccineName ?? null,
          vaccineManufacturer: rule.vaccineManufacturer ?? null,
          batchNumber: rule.batchNumber ?? null,
          medicationName: rule.medicationName ?? null,
          dosage: rule.dosage ?? null,
          frequency: null,
          recurrenceRuleId: rule._id,
          seriesIndex: index,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      created += 1;
    });

    db.update(recurrenceRulesTable)
      .set({
        lastGeneratedDate: now,
        updatedAt: now,
      })
      .where(eq(recurrenceRulesTable._id, rule._id))
      .run();

    return created;
  }

  createRule(data: RecurrenceRuleData): { rule: RecurrenceRule; eventsCreated: number } {
    const now = nowIsoString();
    const _id = createObjectId();

    db.insert(recurrenceRulesTable)
      .values({
        _id,
        petId: data.petId,
        title: data.title,
        type: data.type,
        reminder: data.reminder,
        reminderPreset: data.reminderPreset ?? null,
        vaccineName: data.vaccineName ?? null,
        vaccineManufacturer: data.vaccineManufacturer ?? null,
        batchNumber: data.batchNumber ?? null,
        medicationName: data.medicationName ?? null,
        dosage: data.dosage ?? null,
        frequency: data.frequency,
        interval: data.interval ?? 1,
        daysOfWeek: data.daysOfWeek ? JSON.stringify(data.daysOfWeek) : null,
        dayOfMonth: data.dayOfMonth ?? null,
        timesPerDay: data.timesPerDay ?? null,
        dailyTimes: data.dailyTimes ? JSON.stringify(data.dailyTimes) : null,
        timezone: resolveEffectiveTimezone(data.timezone),
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        exceptionDates: null,
        isActive: true,
        lastGeneratedDate: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const rule = this.getRuleById(_id);
    if (!rule) {
      throw new Error('Failed to create recurrence rule');
    }

    const eventsCreated = this.generateEventsForRule(rule);
    return { rule: this.getRuleById(_id) as RecurrenceRule, eventsCreated };
  }

  private deleteEventsForRule(id: string): number {
    const before = this.getEventsByRuleId(id).length;
    db.delete(eventsTable).where(eq(eventsTable.recurrenceRuleId, id)).run();
    return before;
  }

  updateRule(id: string, data: UpdateRecurrenceRuleData): { rule: RecurrenceRule; eventsUpdated: number } | null {
    const current = this.getRuleById(id);
    if (!current) {
      return null;
    }

    const now = nowIsoString();

    db.update(recurrenceRulesTable)
      .set({
        title: data.title ?? current.title,
        type: data.type ?? current.type,
        reminder: data.reminder ?? current.reminder,
        reminderPreset: data.reminderPreset ?? current.reminderPreset ?? null,
        vaccineName: data.vaccineName ?? current.vaccineName ?? null,
        vaccineManufacturer:
          data.vaccineManufacturer ?? current.vaccineManufacturer ?? null,
        batchNumber: data.batchNumber ?? current.batchNumber ?? null,
        medicationName: data.medicationName ?? current.medicationName ?? null,
        dosage: data.dosage ?? current.dosage ?? null,
        frequency: data.frequency ?? current.frequency,
        interval: data.interval ?? current.interval,
        daysOfWeek:
          typeof data.daysOfWeek !== 'undefined'
            ? JSON.stringify(data.daysOfWeek)
            : current.daysOfWeek
              ? JSON.stringify(current.daysOfWeek)
              : null,
        dayOfMonth:
          typeof data.dayOfMonth !== 'undefined'
            ? data.dayOfMonth ?? null
            : current.dayOfMonth ?? null,
        timesPerDay:
          typeof data.timesPerDay !== 'undefined'
            ? data.timesPerDay ?? null
            : current.timesPerDay ?? null,
        dailyTimes:
          typeof data.dailyTimes !== 'undefined'
            ? JSON.stringify(data.dailyTimes)
            : current.dailyTimes
              ? JSON.stringify(current.dailyTimes)
              : null,
        timezone: data.timezone ?? current.timezone,
        startDate: data.startDate ?? current.startDate,
        endDate:
          typeof data.endDate !== 'undefined'
            ? data.endDate ?? null
            : current.endDate ?? null,
        exceptionDates:
          typeof data.exceptionDates !== 'undefined'
            ? JSON.stringify(data.exceptionDates)
            : current.exceptionDates
              ? JSON.stringify(current.exceptionDates)
              : null,
        isActive: data.isActive ?? current.isActive,
        updatedAt: now,
      })
      .where(eq(recurrenceRulesTable._id, id))
      .run();

    const updatedRule = this.getRuleById(id);
    if (!updatedRule) {
      return null;
    }

    this.deleteEventsForRule(id);
    const eventsUpdated = updatedRule.isActive ? this.generateEventsForRule(updatedRule) : 0;

    return {
      rule: this.getRuleById(id) as RecurrenceRule,
      eventsUpdated,
    };
  }

  deleteRule(id: string): { message: string; eventsDeleted: number } | null {
    const existing = this.getRuleById(id);
    if (!existing) {
      return null;
    }

    const eventsDeleted = this.deleteEventsForRule(id);
    db.delete(recurrenceRulesTable).where(eq(recurrenceRulesTable._id, id)).run();

    return {
      message: 'ok',
      eventsDeleted,
    };
  }

  regenerateEvents(id: string): { eventsDeleted: number; eventsCreated: number } | null {
    const rule = this.getRuleById(id);
    if (!rule) {
      return null;
    }

    const eventsDeleted = this.deleteEventsForRule(id);
    const eventsCreated = rule.isActive ? this.generateEventsForRule(rule) : 0;

    return {
      eventsDeleted,
      eventsCreated,
    };
  }

  getEventsByRuleId(id: string, options?: { includePast?: boolean; limit?: number }): Event[] {
    const rows = db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.recurrenceRuleId, id))
      .all();

    let events = rows.map(mapEventRowToEvent);
    if (!options?.includePast) {
      const now = Date.now();
      events = events.filter((event) => new Date(event.startTime).getTime() >= now);
    }

    events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (options?.limit) {
      return events.slice(0, options.limit);
    }

    return events;
  }

  addException(id: string, date: string): { message: string } | null {
    const rule = this.getRuleById(id);
    if (!rule) {
      return null;
    }

    const timezone = resolveEffectiveTimezone(rule.timezone);
    const dateKeyMatch = date.match(/\d{4}-\d{2}-\d{2}/);
    const exceptionDateKey = dateKeyMatch ? dateKeyMatch[0] : formatInTimeZone(date, timezone, 'yyyy-MM-dd');
    const exceptionDates = new Set(rule.exceptionDates ?? []);
    const wasExistingException = exceptionDates.has(exceptionDateKey);
    exceptionDates.add(exceptionDateKey);

    db.update(recurrenceRulesTable)
      .set({
        exceptionDates: JSON.stringify([...exceptionDates]),
        updatedAt: nowIsoString(),
      })
      .where(eq(recurrenceRulesTable._id, id))
      .run();

    const rows = db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.recurrenceRuleId, id))
      .all();

    let deleted = 0;
    for (const row of rows) {
      const eventDateKey = formatInTimeZone(row.startTime, timezone, 'yyyy-MM-dd');
      if (eventDateKey === exceptionDateKey) {
        db.delete(eventsTable).where(eq(eventsTable._id, row._id)).run();
        deleted += 1;
      }
    }

    return {
      message: deleted > 0 || !wasExistingException ? 'ok' : 'no-op',
    };
  }
}

export const recurrenceRepository = new RecurrenceRepository();

export const recurrenceGenerationUtils = {
  generateOccurrenceDateKeys,
  generateEventStartTimes,
};
