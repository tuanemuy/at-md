/**
 * エンゲージメントの値オブジェクト
 */
import { z } from "zod";

/**
 * エンゲージメントのZodスキーマ
 */
export const engagementSchema = z.object({
  likes: z.number().default(0),
  reposts: z.number().default(0),
  quotes: z.number().default(0),
  replies: z.number().default(0),
});

/**
 * エンゲージメントの型定義
 */
export type Engagement = z.infer<typeof engagementSchema>;
