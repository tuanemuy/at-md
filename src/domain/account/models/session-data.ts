/**
 * セッションの値オブジェクト
 */
import { z } from "zod";

/**
 * セッションのZodスキーマ
 */
export const sessionDataSchema = z.object({
  did: z.string().nonempty(),
});

/**
 * セッションの型定義
 */
export type SessionData = z.infer<typeof sessionDataSchema>;
