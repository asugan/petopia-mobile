import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { initDatabase } from '@/lib/db/init';
import { createObjectId, nowIsoString } from '@/lib/db/utils';
import { type PetRow, petsTable } from '@/lib/db/schema/pets';
import type { CreatePetInput, Pet, UpdatePetInput } from '@/lib/types';
import { normalizeToISOString } from '@/lib/utils/dateConversion';

type PetSortField = 'name' | 'createdAt' | 'updatedAt' | 'type';

interface GetPetsParams {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  sortBy?: PetSortField;
  sortOrder?: 'asc' | 'desc';
}

const mapRowToPet = (row: PetRow): Pet => ({
  _id: row._id,
  name: row.name,
  type: row.type,
  breed: row.breed ?? undefined,
  birthDate: row.birthDate ?? undefined,
  weight: typeof row.weight === 'number' ? row.weight : undefined,
  gender: row.gender ?? undefined,
  profilePhoto: row.profilePhoto ?? undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const sortPets = (
  pets: Pet[],
  sortBy: PetSortField = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
): Pet[] => {
  const direction = sortOrder === 'asc' ? 1 : -1;

  return [...pets].sort((a, b) => {
    const left = String(a[sortBy] ?? '').toLowerCase();
    const right = String(b[sortBy] ?? '').toLowerCase();

    if (left === right) {
      return 0;
    }

    return left > right ? direction : -direction;
  });
};

const normalizeOptionalString = (
  value: string | undefined,
): string | null | undefined => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class PetRepository {
  constructor() {
    initDatabase();
  }

  getPets(params: GetPetsParams = {}): Pet[] {
    const typeFilter = params.type?.trim();
    const searchFilter = params.search?.trim().toLowerCase();

    const filters = [];

    if (typeFilter) {
      filters.push(eq(petsTable.type, typeFilter));
    }

    if (searchFilter) {
      filters.push(sql`lower(${petsTable.name}) LIKE ${`%${searchFilter}%`}`);
    }

    const rows = filters.length > 0
      ? db.select().from(petsTable).where(and(...filters)).all()
      : db.select().from(petsTable).all();

    const sorted = sortPets(
      rows.map(mapRowToPet),
      params.sortBy,
      params.sortOrder,
    );

    if (!params.limit) {
      return sorted;
    }

    const page = Math.max(params.page ?? 1, 1);
    const limit = Math.max(params.limit, 1);
    const offset = (page - 1) * limit;

    return sorted.slice(offset, offset + limit);
  }

  getPetById(id: string): Pet | null {
    const row = db.select().from(petsTable).where(eq(petsTable._id, id)).get();
    return row ? mapRowToPet(row) : null;
  }

  createPet(data: CreatePetInput): Pet {
    const now = nowIsoString();
    const _id = createObjectId();

    db.insert(petsTable)
      .values({
        _id,
        name: data.name.trim(),
        type: data.type,
        breed: normalizeOptionalString(data.breed),
        birthDate: normalizeToISOString(data.birthDate) ?? null,
        weight: typeof data.weight === 'number' ? data.weight : null,
        gender: data.gender ?? null,
        profilePhoto: normalizeOptionalString(data.profilePhoto),
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = this.getPetById(_id);

    if (!created) {
      throw new Error('Failed to create pet');
    }

    return created;
  }

  updatePet(id: string, data: UpdatePetInput): Pet | null {
    const updates: Partial<typeof petsTable.$inferInsert> = {
      updatedAt: nowIsoString(),
    };

    if (typeof data.name !== 'undefined') {
      updates.name = data.name.trim();
    }

    if (typeof data.type !== 'undefined') {
      updates.type = data.type;
    }

    if (typeof data.breed !== 'undefined') {
      updates.breed = normalizeOptionalString(data.breed);
    }

    if (typeof data.birthDate !== 'undefined') {
      updates.birthDate = normalizeToISOString(data.birthDate) ?? null;
    }

    if (typeof data.weight !== 'undefined') {
      updates.weight = typeof data.weight === 'number' ? data.weight : null;
    }

    if (typeof data.gender !== 'undefined') {
      updates.gender = data.gender ?? null;
    }

    if (typeof data.profilePhoto !== 'undefined') {
      updates.profilePhoto = normalizeOptionalString(data.profilePhoto);
    }

    const updateResult = db
      .update(petsTable)
      .set(updates)
      .where(eq(petsTable._id, id))
      .run();

    if (updateResult.changes === 0) {
      return null;
    }

    return this.getPetById(id);
  }

  deletePet(id: string): boolean {
    const deleteResult = db.delete(petsTable).where(eq(petsTable._id, id)).run();
    return deleteResult.changes > 0;
  }
}

export const petRepository = new PetRepository();
