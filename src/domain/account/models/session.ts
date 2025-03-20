/**
 * セッションの値オブジェクト
 */
import { z } from "zod";

/**
 * セッションのZodスキーマ
 */
export const sessionSchema = z.object({
  id: z.string().uuid().optional(),
  did: z.string().nonempty(),
  accessToken: z.string().nonempty(),
  refreshToken: z.string().optional(),
  expiresAt: z.date(),
});

/**
 * セッションの型定義
 */
export type Session = z.infer<typeof sessionSchema>;

/**
 * セッションが有効期限切れかどうかを判定する
 */
export function isSessionExpired(session: Session): boolean {
  return new Date() > session.expiresAt;
}
