/**
 * 表示関連のZodスキーマ定義
 * 
 * 表示ドメインで使用するZodスキーマを定義します。
 */

import { z } from "../../../deps.ts";
import {
  idSchema,
  userIdSchema,
  contentIdSchema,
  dateSchema,
} from "../../common/schemas/base-schemas.ts";

/**
 * テーマID用のスキーマ
 */
export const themeIdSchema = idSchema.brand<"ThemeID">();
export type ThemeID = z.infer<typeof themeIdSchema>;

/**
 * カラーコード用のスキーマ
 */
export const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: "有効なカラーコードを入力してください（例: #FF0000）" }).brand<"Color">();
export type Color = z.infer<typeof colorSchema>;

/**
 * フォント用のスキーマ
 */
export const fontSchema = z.enum(["sans-serif", "serif", "monospace", "custom"]);
export type Font = z.infer<typeof fontSchema>;

/**
 * カスタムフォント用のスキーマ
 */
export const customFontSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});
export type CustomFont = z.infer<typeof customFontSchema>;

/**
 * レイアウト用のスキーマ
 */
export const layoutSchema = z.enum(["standard", "wide", "full", "minimal"]);
export type Layout = z.infer<typeof layoutSchema>;

/**
 * テーマ設定用のスキーマ
 */
export const themeSettingsSchema = z.object({
  primaryColor: colorSchema,
  secondaryColor: colorSchema,
  backgroundColor: colorSchema,
  textColor: colorSchema,
  headingFont: fontSchema,
  bodyFont: fontSchema,
  customHeadingFont: customFontSchema.optional(),
  customBodyFont: customFontSchema.optional(),
  layout: layoutSchema,
  customCSS: z.string().optional(),
});
export type ThemeSettings = z.infer<typeof themeSettingsSchema>;

/**
 * テーマエンティティのスキーマ
 */
export const themeSchema = z.object({
  id: themeIdSchema,
  userId: userIdSchema,
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  settings: themeSettingsSchema,
  isDefault: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type ThemeSchema = z.infer<typeof themeSchema>;

/**
 * テーマ作成パラメータのスキーマ
 */
export const createThemeParamsSchema = z.object({
  userId: userIdSchema,
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  settings: themeSettingsSchema,
  isDefault: z.boolean().default(false),
});
export type CreateThemeParamsSchema = z.infer<typeof createThemeParamsSchema>;

/**
 * テーマ更新パラメータのスキーマ
 */
export const updateThemeParamsSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  settings: themeSettingsSchema.partial().optional(),
  isDefault: z.boolean().optional(),
});
export type UpdateThemeParamsSchema = z.infer<typeof updateThemeParamsSchema>;

/**
 * ページID用のスキーマ
 */
export const pageIdSchema = idSchema.brand<"PageID">();
export type PageID = z.infer<typeof pageIdSchema>;

/**
 * ページタイプ用のスキーマ
 */
export const pageTypeSchema = z.enum(["home", "content", "category", "tag", "author", "custom"]);
export type PageType = z.infer<typeof pageTypeSchema>;

/**
 * ページレイアウト用のスキーマ
 */
export const pageLayoutSchema = z.object({
  template: z.string().min(1),
  sections: z.array(z.record(z.unknown())),
  customCSS: z.string().optional(),
});
export type PageLayout = z.infer<typeof pageLayoutSchema>;

/**
 * ページエンティティのスキーマ
 */
export const pageSchema = z.object({
  id: pageIdSchema,
  userId: userIdSchema,
  type: pageTypeSchema,
  title: z.string().min(1).max(100),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, { message: "スラッグには小文字英数字とハイフンのみ使用できます" }),
  layout: pageLayoutSchema,
  themeId: themeIdSchema.optional(),
  isPublished: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  publishedAt: dateSchema.optional(),
});
export type PageSchema = z.infer<typeof pageSchema>;

/**
 * ページ作成パラメータのスキーマ
 */
export const createPageParamsSchema = z.object({
  userId: userIdSchema,
  type: pageTypeSchema,
  title: z.string().min(1).max(100),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, { message: "スラッグには小文字英数字とハイフンのみ使用できます" }),
  layout: pageLayoutSchema,
  themeId: themeIdSchema.optional(),
  isPublished: z.boolean().default(false),
});
export type CreatePageParamsSchema = z.infer<typeof createPageParamsSchema>;

/**
 * ページ更新パラメータのスキーマ
 */
export const updatePageParamsSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, { message: "スラッグには小文字英数字とハイフンのみ使用できます" }).optional(),
  layout: pageLayoutSchema.optional(),
  themeId: themeIdSchema.optional(),
  isPublished: z.boolean().optional(),
});
export type UpdatePageParamsSchema = z.infer<typeof updatePageParamsSchema>; 