/**
 * 基本的なZodスキーマ定義
 * 
 * プロジェクト全体で再利用可能な基本的なZodスキーマを定義します。
 */

import { z } from "../../../deps.ts";

/**
 * ID用のスキーマ
 * 空でない文字列であることを検証
 */
export const idSchema = z.string().min(1).brand<"ID">();
export type ID = z.infer<typeof idSchema>;

/**
 * ユーザーID用のスキーマ
 */
export const userIdSchema = idSchema.brand<"UserID">();
export type UserID = z.infer<typeof userIdSchema>;

/**
 * リポジトリID用のスキーマ
 */
export const repositoryIdSchema = idSchema.brand<"RepositoryID">();
export type RepositoryID = z.infer<typeof repositoryIdSchema>;

/**
 * コンテンツID用のスキーマ
 */
export const contentIdSchema = idSchema.brand<"ContentID">();
export type ContentID = z.infer<typeof contentIdSchema>;

/**
 * 日付用のスキーマ
 */
export const dateSchema = z.date();
export type DateType = z.infer<typeof dateSchema>;

/**
 * パス用のスキーマ
 * 有効なファイルパスであることを検証
 */
export const pathSchema = z.string().min(1).refine(
  (path) => !path.includes("..") && !path.startsWith("/"),
  { message: "Invalid file path" }
).brand<"Path">();
export type Path = z.infer<typeof pathSchema>;

/**
 * タイトル用のスキーマ
 * 空でない文字列であることを検証
 */
export const titleSchema = z.string().min(1).max(100).brand<"Title">();
export type Title = z.infer<typeof titleSchema>;

/**
 * 本文用のスキーマ
 */
export const bodySchema = z.string().brand<"Body">();
export type Body = z.infer<typeof bodySchema>;

/**
 * タグ用のスキーマ
 */
export const tagSchema = z.string().min(1).max(30).brand<"Tag">();
export type Tag = z.infer<typeof tagSchema>;
export const tagsSchema = z.array(tagSchema);
export type Tags = z.infer<typeof tagsSchema>;

/**
 * カテゴリ用のスキーマ
 */
export const categorySchema = z.string().min(1).max(30).brand<"Category">();
export type Category = z.infer<typeof categorySchema>;
export const categoriesSchema = z.array(categorySchema);
export type Categories = z.infer<typeof categoriesSchema>;

/**
 * 言語用のスキーマ
 */
export const languageSchema = z.string().min(2).max(5).brand<"Language">();
export type Language = z.infer<typeof languageSchema>;

/**
 * 読了時間用のスキーマ
 */
export const readingTimeSchema = z.number().int().min(0).brand<"ReadingTime">();
export type ReadingTime = z.infer<typeof readingTimeSchema>; 