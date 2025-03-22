/**
 * セッションの値オブジェクト
 */
import { z } from "zod";

/**
 * セッションのZodスキーマ
 */
export const sessionSchema = z.object({
  did: z.string().nonempty(),
});

/**
 * セッションの型定義
 */
export type Session = z.infer<typeof sessionSchema>;
