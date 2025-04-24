/**
 * ユーザーエンティティ
 */
import { z } from "zod";
import { profileSchema } from "./profile";

/**
 * ユーザースキーマ
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  did: z.string().nonempty(),
  handle: z.string().nonempty(),
  profile: profileSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * ユーザーの型定義
 */
export type User = z.infer<typeof userSchema>;
