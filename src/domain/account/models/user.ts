import { z } from "zod";
import { idSchema, type ID } from "@/domain/shared/models/id";

/**
 * GitHub連携情報のスキーマ
 */
export const gitHubConnectionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  installationId: z.string().nonempty(),
  accessToken: z.string().nonempty().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * GitHub連携情報の型
 */
export type GitHubConnection = z.infer<typeof gitHubConnectionSchema>;

/**
 * ユーザーのスキーマ
 */
export const userSchema = z.object({
  id: idSchema,
  name: z.string().nonempty(),
  did: z.string().nonempty(),
  createdAt: z.date(),
  updatedAt: z.date(),
  gitHubConnections: z.array(gitHubConnectionSchema).default([])
});

/**
 * ユーザーの型
 */
export type User = z.infer<typeof userSchema>;

/**
 * 新しいユーザーを作成する
 * @param name ユーザー名
 * @param did DID (Decentralized Identifier)
 * @returns 新しいユーザーオブジェクト
 */
export function createUser(name: string, did: string): Omit<User, "id"> {
  const now = new Date();
  return {
    name,
    did,
    createdAt: now,
    updatedAt: now,
    gitHubConnections: []
  };
}

/**
 * 新しいGitHub連携情報を作成する
 * @param userId ユーザーID
 * @param installationId GitHubインストールID
 * @param accessToken アクセストークン（オプション）
 * @returns 新しいGitHub連携情報オブジェクト
 */
export function createGitHubConnection(
  userId: ID,
  installationId: string,
  accessToken: string | null = null
): Omit<GitHubConnection, "id"> {
  const now = new Date();
  return {
    userId,
    installationId,
    accessToken,
    createdAt: now,
    updatedAt: now
  };
} 