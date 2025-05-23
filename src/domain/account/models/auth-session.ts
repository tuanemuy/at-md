import { jsonObjectSchema } from "@/lib/json";
/**
 * AuthSessionの値オブジェクト
 */
import { z } from "zod";

/**
 * AuthSessionのZodスキーマ
 */
export const authSessionSchema = z.object({
  id: z.string().uuid(),
  key: z.string().nonempty(),
  session: jsonObjectSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * AuthSessionの型定義
 */
export type AuthSession = z.infer<typeof authSessionSchema>;
