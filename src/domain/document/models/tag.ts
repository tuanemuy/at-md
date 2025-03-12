import { z } from "zod";
import { idSchema, type ID } from "@/domain/shared/models/id";

/**
 * タグのスキーマ
 */
export const tagSchema = z.object({
  id: idSchema,
  name: z.string().nonempty(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: idSchema,
});

/**
 * タグの型
 */
export type Tag = z.infer<typeof tagSchema>;

/**
 * 文書タグ関連のスキーマ（Many to Many）
 */
export const documentTagSchema = z.object({
  id: idSchema,
  documentId: idSchema,
  tagId: idSchema,
  createdAt: z.date(),
});

/**
 * 文書タグ関連の型
 */
export type DocumentTag = z.infer<typeof documentTagSchema>;

/**
 * 新しいタグを作成する
 * @param name タグ名
 * @param userId ユーザーID
 * @returns 新しいタグオブジェクト
 */
export function createTag(name: string, userId: ID): Omit<Tag, "id"> {
  const now = new Date();
  return {
    name,
    createdAt: now,
    updatedAt: now,
    userId,
  };
}

/**
 * タグを更新する
 * @param tag 既存のタグ
 * @param name 新しいタグ名
 * @returns 更新されたタグ
 */
export function updateTag(tag: Tag, name: string): Tag {
  return {
    ...tag,
    name,
    updatedAt: new Date(),
  };
}

/**
 * 新しい文書タグ関連を作成する
 * @param documentId 文書ID
 * @param tagId タグID
 * @returns 新しい文書タグ関連オブジェクト
 */
export function createDocumentTag(
  documentId: ID,
  tagId: ID,
): Omit<DocumentTag, "id"> {
  return {
    documentId,
    tagId,
    createdAt: new Date(),
  };
}
