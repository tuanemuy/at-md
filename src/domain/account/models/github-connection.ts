/**
 * GitHub連携情報エンティティ
 */
import { z } from "zod";

/**
 * GitHub連携情報のZodスキーマ
 */
export const gitHubConnectionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  accessToken: z.string().nonempty(),
  expiresAt: z.date().nullable(),
  refreshToken: z.string().nonempty().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * GitHub連携情報の型定義
 */
export type GitHubConnection = z.infer<typeof gitHubConnectionSchema>;
