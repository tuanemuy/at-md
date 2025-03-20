/**
 * ブック詳細を表す値オブジェクト
 */
import { z } from "zod";

/**
 * ブック詳細のZodスキーマ
 */
export const bookDetailsSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().default(""),
});

/**
 * ブック詳細の型定義
 */
export type BookDetails = z.infer<typeof bookDetailsSchema>;
