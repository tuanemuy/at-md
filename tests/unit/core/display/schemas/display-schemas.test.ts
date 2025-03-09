/**
 * 表示スキーマのテスト
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { z } from "../../../../../src/deps.ts";
import {
  colorSchema,
  fontSchema,
  customFontSchema,
  layoutSchema,
  themeSettingsSchema,
  themeSchema,
  createThemeParamsSchema,
  updateThemeParamsSchema,
  pageTypeSchema,
  pageLayoutSchema,
  pageSchema,
  createPageParamsSchema,
  updatePageParamsSchema
} from "../../../../../src/core/display/schemas/mod.ts";
import {
  createTestCustomFont,
  createTestThemeSettings,
  createTestTheme,
  createTestThemeParams,
  createTestUpdateThemeParams,
  createTestPageLayout,
  createTestPage,
  createTestPublishedPage,
  createTestPageParams,
  createTestUpdatePageParams,
  createInvalidThemeData,
  createInvalidPageData
} from "../../../../helpers/display-test-factory.ts";

describe("表示スキーマ", () => {
  describe("colorSchema", () => {
    it("有効なカラーコードの場合、バリデーションが成功すること", () => {
      const color = "#007bff";
      const result = colorSchema.safeParse(color);
      expect(result.success).toBe(true);
    });

    it("無効なカラーコードの場合、バリデーションが失敗すること", () => {
      const color = "invalid-color";
      const result = colorSchema.safeParse(color);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("有効なカラーコード");
      }
    });

    it("短いカラーコードの場合、バリデーションが失敗すること", () => {
      const color = "#fff"; // 3桁のカラーコード
      const result = colorSchema.safeParse(color);
      expect(result.success).toBe(false);
    });
  });

  describe("fontSchema", () => {
    it("有効なフォントの場合、バリデーションが成功すること", () => {
      const font = "sans-serif";
      const result = fontSchema.safeParse(font);
      expect(result.success).toBe(true);
    });

    it("無効なフォントの場合、バリデーションが失敗すること", () => {
      const font = "invalid-font";
      const result = fontSchema.safeParse(font);
      expect(result.success).toBe(false);
    });
  });

  describe("customFontSchema", () => {
    it("有効なカスタムフォントの場合、バリデーションが成功すること", () => {
      const customFont = createTestCustomFont();
      const result = customFontSchema.safeParse(customFont);
      expect(result.success).toBe(true);
    });

    it("無効なURLを含むカスタムフォントの場合、バリデーションが失敗すること", () => {
      const customFont = {
        name: "Custom Font",
        url: "invalid-url"
      };
      const result = customFontSchema.safeParse(customFont);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("url");
      }
    });
  });

  describe("layoutSchema", () => {
    it("有効なレイアウトの場合、バリデーションが成功すること", () => {
      const layout = "standard";
      const result = layoutSchema.safeParse(layout);
      expect(result.success).toBe(true);
    });

    it("無効なレイアウトの場合、バリデーションが失敗すること", () => {
      const layout = "invalid-layout";
      const result = layoutSchema.safeParse(layout);
      expect(result.success).toBe(false);
    });
  });

  describe("themeSettingsSchema", () => {
    it("有効なテーマ設定の場合、バリデーションが成功すること", () => {
      const settings = createTestThemeSettings();
      const result = themeSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it("カスタムフォントを含むテーマ設定の場合、バリデーションが成功すること", () => {
      const settings = createTestThemeSettings({
        headingFont: "custom",
        customHeadingFont: createTestCustomFont()
      });
      const result = themeSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it("無効なカラーコードを含むテーマ設定の場合、バリデーションが失敗すること", () => {
      const settings = {
        ...createTestThemeSettings(),
        primaryColor: "invalid-color"
      };
      const result = themeSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("primaryColor");
      }
    });
  });

  describe("themeSchema", () => {
    it("有効なテーマの場合、バリデーションが成功すること", () => {
      const theme = createTestTheme();
      const result = themeSchema.safeParse(theme);
      expect(result.success).toBe(true);
    });

    it("無効なテーマの場合、バリデーションが失敗すること", () => {
      const invalidTheme = createInvalidThemeData();
      const result = themeSchema.safeParse(invalidTheme);
      expect(result.success).toBe(false);
    });
  });

  describe("createThemeParamsSchema", () => {
    it("有効なテーマ作成パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestThemeParams();
      const result = createThemeParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("isDefaultが省略された場合、デフォルト値が設定されること", () => {
      const params = {
        ...createTestThemeParams(),
        isDefault: undefined
      };
      const result = createThemeParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDefault).toBe(false);
      }
    });
  });

  describe("updateThemeParamsSchema", () => {
    it("有効なテーマ更新パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestUpdateThemeParams();
      const result = updateThemeParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("部分的な更新パラメータの場合、バリデーションが成功すること", () => {
      const params = {
        name: "更新されたテーマ"
      };
      const result = updateThemeParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("設定の一部のみを更新する場合、バリデーションが成功すること", () => {
      const params = {
        settings: {
          primaryColor: "#0066cc"
        }
      };
      const result = updateThemeParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });
  });

  describe("pageTypeSchema", () => {
    it("有効なページタイプの場合、バリデーションが成功すること", () => {
      const pageType = "content";
      const result = pageTypeSchema.safeParse(pageType);
      expect(result.success).toBe(true);
    });

    it("無効なページタイプの場合、バリデーションが失敗すること", () => {
      const pageType = "invalid-type";
      const result = pageTypeSchema.safeParse(pageType);
      expect(result.success).toBe(false);
    });
  });

  describe("pageLayoutSchema", () => {
    it("有効なページレイアウトの場合、バリデーションが成功すること", () => {
      const layout = createTestPageLayout();
      const result = pageLayoutSchema.safeParse(layout);
      expect(result.success).toBe(true);
    });

    it("必須フィールドが欠けている場合、バリデーションが失敗すること", () => {
      const layout = {
        // templateが欠けている
        sections: []
      };
      const result = pageLayoutSchema.safeParse(layout);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("template");
      }
    });
  });

  describe("pageSchema", () => {
    it("有効なページの場合、バリデーションが成功すること", () => {
      const page = createTestPage();
      const result = pageSchema.safeParse(page);
      expect(result.success).toBe(true);
    });

    it("公開ページの場合、バリデーションが成功すること", () => {
      const page = createTestPublishedPage();
      const result = pageSchema.safeParse(page);
      expect(result.success).toBe(true);
    });

    it("無効なページの場合、バリデーションが失敗すること", () => {
      const invalidPage = createInvalidPageData();
      const result = pageSchema.safeParse(invalidPage);
      expect(result.success).toBe(false);
    });
  });

  describe("createPageParamsSchema", () => {
    it("有効なページ作成パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestPageParams();
      const result = createPageParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("isPublishedが省略された場合、デフォルト値が設定されること", () => {
      const params = {
        ...createTestPageParams(),
        isPublished: undefined
      };
      const result = createPageParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublished).toBe(false);
      }
    });

    it("無効なスラッグを含む場合、バリデーションが失敗すること", () => {
      const params = {
        ...createTestPageParams(),
        slug: "invalid slug" // スペースを含む
      };
      const result = createPageParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("slug");
      }
    });
  });

  describe("updatePageParamsSchema", () => {
    it("有効なページ更新パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestUpdatePageParams();
      const result = updatePageParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("部分的な更新パラメータの場合、バリデーションが成功すること", () => {
      const params = {
        title: "更新されたページ"
      };
      const result = updatePageParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("無効なスラッグを含む場合、バリデーションが失敗すること", () => {
      const params = {
        slug: "invalid slug" // スペースを含む
      };
      const result = updatePageParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("slug");
      }
    });
  });
}); 