import { eq } from 'drizzle-orm';
import { formatInTimeZone } from 'date-fns-tz';
import { db } from '@/lib/db/client';
import { initDatabase } from '@/lib/db/init';
import { createObjectId, nowIsoString } from '@/lib/db/utils';
import { eventsTable, type EventRow } from '@/lib/db/schema/events';
import type { CreateEventInput, Event, UpdateEventInput } from '@/lib/types';
import { normalizeToISOString } from '@/lib/utils/dateConversion';
import { resolveEffectiveTimezone } from '@/lib/utils/timezone';

const mapRowToEvent = (row: EventRow): Event => ({
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

const isUpcomingStatus = (status: string): boolean => {
  return status !== 'completed' && status !== 'cancelled' && status !== 'missed';
};

const sortByStartTimeAsc = (events: Event[]): Event[] => {
  return [...events].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
};

export class EventRepository {
  constructor() {
    initDatabase();
  }

  getEvents(): Event[] {
    const rows = db.select().from(eventsTable).all();
    return rows.map(mapRowToEvent);
  }

  getEventsByPetId(petId: string): Event[] {
    const rows = db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.petId, petId))
      .all();

    return rows.map(mapRowToEvent);
  }

  getEventById(id: string): Event | null {
    const row = db.select().from(eventsTable).where(eq(eventsTable._id, id)).get();
    return row ? mapRowToEvent(row) : null;
  }

  createEvent(data: CreateEventInput): Event {
    const now = nowIsoString();
    const _id = createObjectId();

    db.insert(eventsTable)
      .values({
        _id,
        petId: data.petId,
        title: data.title,
        type: data.type,
        startTime: normalizeToISOString(data.startTime) ?? now,
        reminder: data.reminder ?? false,
        reminderPreset: data.reminderPreset ?? null,
        status: 'upcoming',
        vaccineName: data.vaccineName ?? null,
        vaccineManufacturer: data.vaccineManufacturer ?? null,
        batchNumber: data.batchNumber ?? null,
        medicationName: data.medicationName ?? null,
        dosage: data.dosage ?? null,
        frequency: data.frequency ?? null,
        recurrenceRuleId: null,
        seriesIndex: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = this.getEventById(_id);
    if (!created) {
      throw new Error('Failed to create event');
    }

    return created;
  }

  updateEvent(id: string, data: UpdateEventInput): Event | null {
    const updates: Partial<typeof eventsTable.$inferInsert> = {
      updatedAt: nowIsoString(),
    };

    if (typeof data.title !== 'undefined') {
      updates.title = data.title;
    }
    if (typeof data.petId !== 'undefined') {
      updates.petId = data.petId;
    }
    if (typeof data.type !== 'undefined') {
      updates.type = data.type;
    }
    if (typeof data.startTime !== 'undefined') {
      updates.startTime = normalizeToISOString(data.startTime) ?? nowIsoString();
    }
    if (typeof data.reminder !== 'undefined') {
      updates.reminder = data.reminder;
    }
    if (typeof data.reminderPreset !== 'undefined') {
      updates.reminderPreset = data.reminderPreset ?? null;
    }
    if (typeof data.status !== 'undefined') {
      updates.status = data.status;
    }
    if (typeof data.vaccineName !== 'undefined') {
      updates.vaccineName = data.vaccineName ?? null;
    }
    if (typeof data.vaccineManufacturer !== 'undefined') {
      updates.vaccineManufacturer = data.vaccineManufacturer ?? null;
    }
    if (typeof data.batchNumber !== 'undefined') {
      updates.batchNumber = data.batchNumber ?? null;
    }
    if (typeof data.medicationName !== 'undefined') {
      updates.medicationName = data.medicationName ?? null;
    }
    if (typeof data.dosage !== 'undefined') {
      updates.dosage = data.dosage ?? null;
    }
    if (typeof data.frequency !== 'undefined') {
      updates.frequency = data.frequency ?? null;
    }

    const result = db.update(eventsTable).set(updates).where(eq(eventsTable._id, id)).run();
    if (result.changes === 0) {
      return null;
    }

    return this.getEventById(id);
  }

  deleteEvent(id: string): boolean {
    const result = db.delete(eventsTable).where(eq(eventsTable._id, id)).run();
    return result.changes > 0;
  }

  getEventsByDate(date: string, timezone?: string): Event[] {
    const tz = resolveEffectiveTimezone(timezone);

    return this.getEvents().filter((event) => {
      try {
        return formatInTimeZone(event.startTime, tz, 'yyyy-MM-dd') === date;
      } catch {
        return false;
      }
    });
  }

  getUpcomingEvents(_timezone?: string): Event[] {
    const now = new Date().getTime();

    return sortByStartTimeAsc(
      this.getEvents().filter((event) => {
        const start = new Date(event.startTime).getTime();
        return start >= now && isUpcomingStatus(event.status);
      }),
    );
  }

  getTodayEvents(timezone?: string): Event[] {
    const tz = resolveEffectiveTimezone(timezone);
    const today = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
    return this.getEventsByDate(today, tz);
  }
}

export const eventRepository = new EventRepository();
