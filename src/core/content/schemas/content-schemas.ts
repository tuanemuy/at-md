/**
 * コンテンツ関連のZodスキーマ定義
 * 
 * コンテンツドメインで使用するZodスキーマを定義します。
 */

import { z } from "../deps.ts";
import {
  contentIdSchema,
  userIdSchema,
  repositoryIdSchema,
  pathSchema,
  titleSchema,
  bodySchema,
  tagsSchema,
  categoriesSchema,
  languageSchema,
  readingTimeSchema,
  dateSchema
} from "../../common/schemas/mod.ts";

/**
 * コンテンツの公開範囲を表すスキーマ
 */
export const contentVisibilitySchema = z.enum(["private", "unlisted", "public"]);
export type ContentVisibilitySchema = z.infer<typeof contentVisibilitySchema>;

/**
 * コンテンツメタデータのスキーマ
 */
export const contentMetadataSchema = z.object({
  tags: tagsSchema,
  categories: categoriesSchema,
  publishedAt: dateSchema.optional(),
  lastPublishedAt: dateSchema.optional(),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional(),
  language: languageSchema,
  readingTime: readingTimeSchema.optional()
});
export type ContentMetadataSchema = z.infer<typeof contentMetadataSchema>;

/**
 * コンテンツの変更内容を表すスキーマ
 */
export const contentChangesSchema = z.object({
  title: titleSchema.optional(),
  body: bodySchema.optional(),
  metadata: z.object({
    tags: tagsSchema.optional(),
    categories: categoriesSchema.optional(),
    language: languageSchema.optional(),
    readingTime: readingTimeSchema.optional()
  }).partial().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "変更内容は少なくとも1つ以上必要です" }
);
export type ContentChangesSchema = z.infer<typeof contentChangesSchema>;

/**
 * バージョンのスキーマ
 */
export const versionSchema = z.object({
  id: z.string().min(1),
  contentId: contentIdSchema,
  commitId: z.string().min(1),
  createdAt: dateSchema,
  changes: contentChangesSchema
});
export type VersionSchema = z.infer<typeof versionSchema>;

/**
 * コンテンツエンティティのスキーマ
 */
export const contentSchema = z.object({
  id: contentIdSchema,
  userId: userIdSchema,
  repositoryId: repositoryIdSchema,
  path: pathSchema,
  title: titleSchema,
  body: bodySchema,
  metadata: contentMetadataSchema,
  versions: z.array(versionSchema),
  visibility: contentVisibilitySchema,
  createdAt: dateSchema,
  updatedAt: dateSchema
});
export type ContentSchema = z.infer<typeof contentSchema>;

/**
 * コンテンツ作成パラメータのスキーマ
 */
export const createContentParamsSchema = contentSchema;
export type CreateContentParamsSchema = z.infer<typeof createContentParamsSchema>;

/**
 * コンテンツ更新パラメータのスキーマ
 */
export const updateContentParamsSchema = z.object({
  title: titleSchema.optional(),
  body: bodySchema.optional(),
  metadata: contentMetadataSchema.optional(),
  visibility: contentVisibilitySchema.optional()
});
export type UpdateContentParamsSchema = z.infer<typeof updateContentParamsSchema>; 