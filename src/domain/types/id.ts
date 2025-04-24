import { v7 as uuidv7 } from "uuid";
import { z } from "zod";

/**
 * Branded type to define ID type for a specific entity
 * Uses generic parameter T to distinguish IDs of different entities
 */
export type ID<T extends string> = string & { readonly __brand: T };

/**
 * Zod schema to validate if the string is a valid UUID for ID type
 */
export const idSchema = <T extends string>(
  entityName: T,
): z.ZodEffects<z.ZodString, ID<T>, string> =>
  z
    .string()
    .uuid({ message: `${entityName} ID must be a valid UUID format` })
    .transform((val): ID<T> => val as ID<T>)
    .describe(`${entityName} ID`);

/**
 * Generate a new UUID format ID
 * Uses UUIDv7 (sortable by time, high uniqueness)
 * @param entityName Entity name (used as type parameter)
 */
export function generateId<T extends string>(entityName: T): ID<T> {
  return uuidv7() as ID<T>;
}
