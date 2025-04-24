/**
 * GitHubリポジトリ情報のDTO
 */
import { z } from "zod";

/**
 * GitHubリポジトリ情報のZodスキーマ
 */
export const gitHubRepositorySchema = z.object({
  owner: z.string().nonempty(),
  name: z.string().nonempty(),
  fullName: z.string().nonempty(),
});

/**
 * GitHubリポジトリ情報の型定義
 */
export type GitHubRepository = z.infer<typeof gitHubRepositorySchema>;
