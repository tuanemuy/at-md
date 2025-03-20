/**
 * プロフィールの値オブジェクト
 */
import { z } from "zod";

/**
 * プロフィールのZodスキーマ
 */
export const profileSchema = z.object({
  displayName: z.string().max(64).nullable(),
  description: z.string().max(256).nullable(),
  avatarUrl: z.string().url().nullable(),
  bannerUrl: z.string().url().nullable(),
});

/**
 * プロフィールの型定義
 */
export type Profile = z.infer<typeof profileSchema>;
