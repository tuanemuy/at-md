import { z } from "zod";
import { idSchema, type ID } from "@/domain/shared/models/id";

/**
 * GitHubリポジトリのスキーマ
 */
export const gitHubRepoSchema = z.object({
  id: idSchema,
  owner: z.string().nonempty(),
  name: z.string().nonempty(),
  fullName: z.string().nonempty(), // owner/name
  installationId: z.string().nonempty(),
  webhookSecret: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: idSchema,
});

/**
 * GitHubリポジトリの型
 */
export type GitHubRepo = z.infer<typeof gitHubRepoSchema>;

/**
 * 新しいGitHubリポジトリを作成する
 * @param owner リポジトリオーナー
 * @param name リポジトリ名
 * @param installationId インストールID
 * @param userId ユーザーID
 * @param webhookSecret Webhookシークレット（オプション）
 * @returns 新しいGitHubリポジトリオブジェクト
 */
export function createGitHubRepo(
  owner: string,
  name: string,
  installationId: string,
  userId: ID,
  webhookSecret?: string,
): Omit<GitHubRepo, "id"> {
  const now = new Date();
  return {
    owner,
    name,
    fullName: `${owner}/${name}`,
    installationId,
    webhookSecret,
    createdAt: now,
    updatedAt: now,
    userId,
  };
}

/**
 * GitHubリポジトリを更新する
 * @param gitHubRepo 既存のGitHubリポジトリ
 * @param updates 更新内容
 * @returns 更新されたGitHubリポジトリ
 */
export function updateGitHubRepo(
  gitHubRepo: GitHubRepo,
  updates: Partial<Pick<GitHubRepo, "installationId" | "webhookSecret">>,
): GitHubRepo {
  // 更新可能なフィールドのみを抽出
  const { installationId, webhookSecret } = updates;

  // 更新オブジェクトを作成（undefined値は含めない）
  const validUpdates: Partial<
    Pick<GitHubRepo, "installationId" | "webhookSecret">
  > = {};
  if (installationId !== undefined)
    validUpdates.installationId = installationId;
  if (webhookSecret !== undefined) validUpdates.webhookSecret = webhookSecret;

  return {
    ...gitHubRepo,
    ...validUpdates,
    updatedAt: new Date(),
  };
}
