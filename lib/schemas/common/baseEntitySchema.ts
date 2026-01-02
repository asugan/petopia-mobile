import { z } from 'zod';
import { objectIdSchema } from '../core/validators';
import { dateStringSchema } from '../core/dateSchemas';

/**
 * Base entity schema with common server-side fields.
 * Used for all entities that have _id, createdAt, and updatedAt.
 */
export const BaseEntitySchema = () =>
  z.object({
    _id: objectIdSchema(),
    createdAt: dateStringSchema(),
    updatedAt: dateStringSchema(),
  });

export type BaseEntity = z.infer<ReturnType<typeof BaseEntitySchema>>;
