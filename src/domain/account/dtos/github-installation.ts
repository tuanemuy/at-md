/**
 * GitHubインストール情報DTO
 */
import { z } from "zod";

/**
 * GitHubインストール情報のZodスキーマ
 */
export const gitHubInstallationSchema = z.object({
  id: z.number(),
  account: z.object({
    login: z.string(),
    type: z.enum(["User", "Organization"])
  }),
  repositorySelection: z.enum(["all", "selected"])
});

/**
 * GitHubインストール情報の型定義
 */
export type GitHubInstallation = z.infer<typeof gitHubInstallationSchema>; 