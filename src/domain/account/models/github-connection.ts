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
  refreshToken: z.string().optional(),
  expiresAt: z.date().optional(),
  scope: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * GitHub連携情報の型定義
 */
export type GitHubConnection = z.infer<typeof gitHubConnectionSchema>;

/**
 * GitHub連携情報が有効期限切れかどうかを判定する
 */
export function isGitHubConnectionExpired(
  connection: GitHubConnection,
): boolean {
  if (!connection.expiresAt) {
    return false;
  }
  return new Date() > connection.expiresAt;
}
