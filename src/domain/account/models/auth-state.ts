import { jsonObjectSchema } from "@/lib/json";
/**
 * AuthStateの値オブジェクト
 */
import { z } from "zod";

/**
 * AuthStateのZodスキーマ
 */
export const authStateSchema = z.object({
  id: z.string().uuid(),
  key: z.string().nonempty(),
  state: jsonObjectSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * AuthStateの型定義
 */
export type AuthState = z.infer<typeof authStateSchema>;
