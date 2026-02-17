import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;

const state = vi.hoisted(() => ({
  events: [] as Row[],
  rules: [] as Row[],
  idCounter: 1,
  recurrenceRulesTable: {
    __name: 'recurrence_rules',
    _id: '_id',
  },
  eventsTable: {
    __name: 'events',
    _id: '_id',
    recurrenceRuleId: 'recurrenceRuleId',
  },
}));

const readRows = (table: { __name: string }): Row[] =>
  table.__name === 'events' ? state.events : state.rules;

const matchCondition = (row: Row, condition: unknown): boolean => {
  if (!condition) {
    return true;
  }

  if (typeof condition === 'function') {
    return Boolean(condition(row));
  }

  if (typeof condition === 'object' && condition !== null && 'kind' in (condition as Row)) {
    const typed = condition as { kind: string; column: string; value: unknown };
    if (typed.kind === 'eq') {
      return row[typed.column] === typed.value;
    }
  }

  return true;
};

vi.mock('drizzle-orm', () => ({
  eq: (column: string, value: unknown) => ({ kind: 'eq', column, value }),
  and: (...conditions: unknown[]) => (row: Row) =>
    conditions.every((condition) => matchCondition(row, condition)),
}));

vi.mock('@/lib/db/schema/recurrenceRules', () => ({
  recurrenceRulesTable: state.recurrenceRulesTable,
}));

vi.mock('@/lib/db/schema/events', () => ({
  eventsTable: state.eventsTable,
}));

vi.mock('@/lib/db/init', () => ({
  initDatabase: vi.fn(),
}));

vi.mock('@/lib/db/utils', () => ({
  createObjectId: () => `oid-${state.idCounter++}`,
  nowIsoString: () => '2099-01-01T00:00:00.000Z',
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: () => ({
      from: (table: { __name: string }) => ({
        all: () => [...readRows(table)],
        where: (condition: unknown) => ({
          all: () => readRows(table).filter((row) => matchCondition(row, condition)),
          get: () => readRows(table).find((row) => matchCondition(row, condition)) ?? null,
        }),
      }),
    }),
    insert: (table: { __name: string }) => ({
      values: (value: Row) => ({
        run: () => {
          readRows(table).push({ ...value });
          return { changes: 1 };
        },
      }),
    }),
    update: (table: { __name: string }) => ({
      set: (updates: Row) => ({
        where: (condition: unknown) => ({
          run: () => {
            const rows = readRows(table);
            let changes = 0;
            for (let i = 0; i < rows.length; i += 1) {
              if (matchCondition(rows[i], condition)) {
                rows[i] = { ...rows[i], ...updates };
                changes += 1;
              }
            }
            return { changes };
          },
        }),
      }),
    }),
    delete: (table: { __name: string }) => ({
      where: (condition: unknown) => ({
        run: () => {
          const rows = readRows(table);
          const kept = rows.filter((row) => !matchCondition(row, condition));
          const changes = rows.length - kept.length;

          if (table.__name === 'events') {
            state.events = kept;
          } else {
            state.rules = kept;
          }

          return { changes };
        },
      }),
    }),
  },
}));

import { recurrenceRepository } from '@/lib/repositories/recurrenceRepository';

describe('recurrenceRepository CRUD', () => {
  beforeEach(() => {
    state.events = [];
    state.rules = [];
    state.idCounter = 1;
  });

  it('creates rule and generated events', () => {
    const result = recurrenceRepository.createRule({
      petId: 'pet-1',
      title: 'Medicine',
      type: 'medication',
      reminder: true,
      reminderPreset: 'standard',
      frequency: 'daily',
      interval: 1,
      timezone: 'UTC',
      dailyTimes: ['09:00'],
      startDate: '2099-01-01T00:00:00.000Z',
      endDate: '2099-01-03',
    });

    expect(result.rule._id).toBeDefined();
    expect(result.eventsCreated).toBe(3);
    expect(state.rules).toHaveLength(1);
    expect(state.events).toHaveLength(3);
  });

  it('updates rule and regenerates events based on active flag', () => {
    const created = recurrenceRepository.createRule({
      petId: 'pet-1',
      title: 'Medicine',
      type: 'medication',
      reminder: true,
      reminderPreset: 'standard',
      frequency: 'daily',
      interval: 1,
      timezone: 'UTC',
      dailyTimes: ['09:00'],
      startDate: '2099-01-01T00:00:00.000Z',
      endDate: '2099-01-02',
    });

    const updated = recurrenceRepository.updateRule(created.rule._id, {
      isActive: false,
      title: 'Medicine paused',
    });

    expect(updated?.rule.title).toBe('Medicine paused');
    expect(updated?.eventsUpdated).toBe(0);
    expect(state.events).toHaveLength(0);
  });

  it('adds exception date and deletes matching occurrence events', () => {
    const created = recurrenceRepository.createRule({
      petId: 'pet-1',
      title: 'Medicine',
      type: 'medication',
      reminder: true,
      reminderPreset: 'standard',
      frequency: 'daily',
      interval: 1,
      timezone: 'UTC',
      dailyTimes: ['09:00'],
      startDate: '2099-01-01T00:00:00.000Z',
      endDate: '2099-01-03',
    });

    const response = recurrenceRepository.addException(created.rule._id, '2099-01-02');
    expect(response?.message).toBe('ok');

    const refreshedRule = recurrenceRepository.getRuleById(created.rule._id);
    expect(refreshedRule?.exceptionDates).toContain('2099-01-02');

    const allRuleEvents = recurrenceRepository.getEventsByRuleId(created.rule._id, {
      includePast: true,
    });
    expect(allRuleEvents).toHaveLength(2);
  });

  it('deletes rule and linked events', () => {
    const created = recurrenceRepository.createRule({
      petId: 'pet-1',
      title: 'Medicine',
      type: 'medication',
      reminder: true,
      reminderPreset: 'standard',
      frequency: 'daily',
      interval: 1,
      timezone: 'UTC',
      dailyTimes: ['09:00'],
      startDate: '2099-01-01T00:00:00.000Z',
      endDate: '2099-01-02',
    });

    const deleted = recurrenceRepository.deleteRule(created.rule._id);

    expect(deleted?.eventsDeleted).toBeGreaterThan(0);
    expect(state.rules).toHaveLength(0);
    expect(state.events).toHaveLength(0);
  });
});
