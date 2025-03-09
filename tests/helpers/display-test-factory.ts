/**
 * 表示関連のテストデータファクトリ
 * 
 * 表示ドメインのテスト用データを生成するためのファクトリ関数を提供します。
 */

import { z } from "../../src/deps.ts";
import {
  themeIdSchema,
  colorSchema,
  fontSchema,
  customFontSchema,
  layoutSchema,
  themeSettingsSchema,
  themeSchema,
  createThemeParamsSchema,
  updateThemeParamsSchema,
  pageIdSchema,
  pageTypeSchema,
  pageLayoutSchema,
  pageSchema,
  createPageParamsSchema,
  updatePageParamsSchema,
  type ThemeSettings,
  type ThemeSchema,
  type CreateThemeParamsSchema,
  type UpdateThemeParamsSchema,
  type PageLayout,
  type PageSchema,
  type CreatePageParamsSchema,
  type UpdatePageParamsSchema
} from "../../src/core/display/schemas/mod.ts";
import { Result, ok, err } from "../../src/deps.ts";

/**
 * テスト用のカスタムフォントを作成する
 * @param overrides 上書きするプロパティ
 * @returns カスタムフォント
 */
export function createTestCustomFont(overrides: Partial<z.infer<typeof customFontSchema>> = {}): z.infer<typeof customFontSchema> {
  return customFontSchema.parse({
    name: "Custom Font",
    url: "https://example.com/fonts/custom-font.woff2",
    ...overrides
  });
}

/**
 * テスト用のテーマ設定を作成する
 * @param overrides 上書きするプロパティ
 * @returns テーマ設定
 */
export function createTestThemeSettings(overrides: Partial<ThemeSettings> = {}): ThemeSettings {
  return themeSettingsSchema.parse({
    primaryColor: "#007bff",
    secondaryColor: "#6c757d",
    backgroundColor: "#ffffff",
    textColor: "#212529",
    headingFont: "sans-serif",
    bodyFont: "sans-serif",
    layout: "standard",
    ...overrides
  });
}

/**
 * テスト用のテーマを作成する
 * @param overrides 上書きするプロパティ
 * @returns テーマ
 */
export function createTestTheme(overrides: Partial<ThemeSchema> = {}): ThemeSchema {
  return themeSchema.parse({
    id: "theme-123",
    userId: "user-456",
    name: "テストテーマ",
    description: "テスト用のテーマです",
    settings: createTestThemeSettings(),
    isDefault: false,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z"),
    ...overrides
  });
}

/**
 * テスト用のテーマ作成パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns テーマ作成パラメータ
 */
export function createTestThemeParams(overrides: Partial<CreateThemeParamsSchema> = {}): CreateThemeParamsSchema {
  return createThemeParamsSchema.parse({
    userId: "user-456",
    name: "新しいテーマ",
    description: "新しく作成したテーマです",
    settings: createTestThemeSettings(),
    isDefault: false,
    ...overrides
  });
}

/**
 * テスト用のテーマ更新パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns テーマ更新パラメータ
 */
export function createTestUpdateThemeParams(overrides: Partial<UpdateThemeParamsSchema> = {}): UpdateThemeParamsSchema {
  return updateThemeParamsSchema.parse({
    name: "更新されたテーマ",
    description: "更新されたテーマの説明",
    settings: {
      primaryColor: "#0066cc",
      secondaryColor: "#5a6268"
    },
    ...overrides
  });
}

/**
 * テスト用のページレイアウトを作成する
 * @param overrides 上書きするプロパティ
 * @returns ページレイアウト
 */
export function createTestPageLayout(overrides: Partial<PageLayout> = {}): PageLayout {
  return pageLayoutSchema.parse({
    template: "default",
    sections: [
      {
        type: "header",
        title: "ページタイトル",
        subtitle: "ページのサブタイトル"
      },
      {
        type: "content",
        contentId: "content-123"
      },
      {
        type: "footer",
        copyright: "© 2023 Test Company"
      }
    ],
    ...overrides
  });
}

/**
 * テスト用のページを作成する
 * @param overrides 上書きするプロパティ
 * @returns ページ
 */
export function createTestPage(overrides: Partial<PageSchema> = {}): PageSchema {
  return pageSchema.parse({
    id: "page-123",
    userId: "user-456",
    type: "content",
    title: "テストページ",
    slug: "test-page",
    layout: createTestPageLayout(),
    themeId: "theme-123",
    isPublished: false,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z"),
    ...overrides
  });
}

/**
 * テスト用の公開ページを作成する
 * @param overrides 上書きするプロパティ
 * @returns 公開ページ
 */
export function createTestPublishedPage(overrides: Partial<PageSchema> = {}): PageSchema {
  return pageSchema.parse({
    id: "page-123",
    userId: "user-456",
    type: "content",
    title: "公開テストページ",
    slug: "published-test-page",
    layout: createTestPageLayout(),
    themeId: "theme-123",
    isPublished: true,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-02T00:00:00Z"),
    publishedAt: new Date("2023-01-02T00:00:00Z"),
    ...overrides
  });
}

/**
 * テスト用のページ作成パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns ページ作成パラメータ
 */
export function createTestPageParams(overrides: Partial<CreatePageParamsSchema> = {}): CreatePageParamsSchema {
  return createPageParamsSchema.parse({
    userId: "user-456",
    type: "content",
    title: "新しいページ",
    slug: "new-page",
    layout: createTestPageLayout(),
    themeId: "theme-123",
    isPublished: false,
    ...overrides
  });
}

/**
 * テスト用のページ更新パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns ページ更新パラメータ
 */
export function createTestUpdatePageParams(overrides: Partial<UpdatePageParamsSchema> = {}): UpdatePageParamsSchema {
  return updatePageParamsSchema.parse({
    title: "更新されたページ",
    slug: "updated-page",
    isPublished: true,
    ...overrides
  });
}

/**
 * 無効なテーマデータを作成する（バリデーションエラーのテスト用）
 * @returns 無効なテーマデータ
 */
export function createInvalidThemeData(): Record<string, unknown> {
  return {
    id: "theme-123",
    userId: "user-456",
    name: "", // 空の名前（1文字以上必要）
    settings: {
      primaryColor: "invalid-color", // 無効なカラーコード
      secondaryColor: "#6c757d",
      backgroundColor: "#ffffff",
      textColor: "#212529",
      headingFont: "invalid-font", // 無効なフォント
      bodyFont: "sans-serif",
      layout: "invalid-layout" // 無効なレイアウト
    },
    isDefault: false,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z")
  };
}

/**
 * 無効なページデータを作成する（バリデーションエラーのテスト用）
 * @returns 無効なページデータ
 */
export function createInvalidPageData(): Record<string, unknown> {
  return {
    id: "page-123",
    userId: "user-456",
    type: "invalid-type", // 無効なページタイプ
    title: "", // 空のタイトル（1文字以上必要）
    slug: "invalid slug", // 無効なスラッグ（スペースを含む）
    layout: {
      // templateが欠けている
      sections: []
    },
    isPublished: false,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z")
  };
} 