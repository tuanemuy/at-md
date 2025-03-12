import { z } from "zod";
import { idSchema, type ID } from "@/domain/shared/models/id";

/**
 * 文書公開範囲のスキーマ
 */
export const documentScopeSchema = z.enum(["private", "public", "limited"]);

/**
 * 文書公開範囲の型
 */
export type DocumentScope = z.infer<typeof documentScopeSchema>;

/**
 * 文書のスキーマ
 */
export const documentSchema = z.object({
  id: idSchema,
  gitHubRepoId: idSchema,
  path: z.string().nonempty(),
  title: z.string().nonempty(),
  description: z.string().optional(),
  document: z.string().nonempty(), // Markdown
  scope: documentScopeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: idSchema,
});

/**
 * 文書の型
 */
export type Document = z.infer<typeof documentSchema>;

/**
 * 新しい文書を作成する
 * @param gitHubRepoId GitHubリポジトリID
 * @param path ファイルパス
 * @param title タイトル
 * @param document 文書内容（Markdown）
 * @param userId ユーザーID
 * @param description 説明（オプション）
 * @param scope 公開範囲（デフォルト: private）
 * @returns 新しい文書オブジェクト
 */
export function createDocument(
  gitHubRepoId: ID,
  path: string,
  title: string,
  document: string,
  userId: ID,
  description?: string,
  scope: DocumentScope = "private",
): Omit<Document, "id"> {
  const now = new Date();
  return {
    gitHubRepoId,
    path,
    title,
    document,
    description,
    scope,
    createdAt: now,
    updatedAt: now,
    userId,
  };
}

/**
 * 文書を更新する
 * @param document 既存の文書
 * @param updates 更新内容
 * @returns 更新された文書
 */
export function updateDocument(
  document: Document,
  updates: Partial<
    Pick<Document, "title" | "description" | "document" | "scope">
  >,
): Document {
  return {
    ...document,
    ...updates,
    updatedAt: new Date(),
  };
}
