/**
 * GitHubウェブフック情報のDTO
 */
import { z } from "zod";

/**
 * GitHubウェブフック情報のZodスキーマ
 */
export const gitHubWebhookSchema = z.object({
  id: z.number(),
  name: z.string(),
  active: z.boolean(),
  events: z.array(z.string()),
  config: z.object({
    url: z.string().url(),
    content_type: z.string(),
    insecure_ssl: z.union([z.string(), z.number(), z.boolean()]).optional(),
  }),
});

/**
 * GitHubウェブフック情報の型定義
 */
export type GitHubWebhook = z.infer<typeof gitHubWebhookSchema>;
