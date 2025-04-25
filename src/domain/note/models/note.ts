/**
 * ノートエンティティ
 */
import { z } from "zod";

/**
 * ノートスコープ
 */
export const NoteScope = {
  PUBLIC: "public",
  PRIVATE: "private",
  LIMITED: "limited",
} as const;

export type NoteScope = (typeof NoteScope)[keyof typeof NoteScope];

/**
 * ノートスコープのZodスキーマ
 */
export const noteScopeSchema = z.enum([
  NoteScope.PUBLIC,
  NoteScope.PRIVATE,
  NoteScope.LIMITED,
]);

/**
 * ノートのZodスキーマ
 */
export const noteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  path: z.string().nonempty(),
  title: z.string().nonempty(),
  body: z.string(),
  scope: noteScopeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * ノートの型定義
 */
export type Note = z.infer<typeof noteSchema>;

export const separator = "--";
