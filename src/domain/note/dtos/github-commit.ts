/**
 * GitHubコミット情報のDTO
 */
import { z } from "zod";

/**
 * GitHubコミット情報のZodスキーマ
 */
export const gitHubCommitSchema = z.object({
  id: z.string().nonempty(),
  message: z.string(),
  timestamp: z.string(),
  url: z.string().url(),
  added: z.array(z.string()),
  removed: z.array(z.string()),
  modified: z.array(z.string())
});

/**
 * GitHubコミット情報の型定義
 */
export type GitHubCommit = z.infer<typeof gitHubCommitSchema>; 