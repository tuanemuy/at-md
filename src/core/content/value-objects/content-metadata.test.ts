import { assertEquals, assertThrows } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { ContentMetadata, createContentMetadata, MetadataCreationError } from "./content-metadata.ts";
import { tagsSchema, categoriesSchema, languageSchema } from "../../common/schemas/mod.ts";

describe("ContentMetadata値オブジェクト", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    // 期待する結果
    const tags = tagsSchema.parse(["markdown", "blog"]);
    const categories = categoriesSchema.parse(["tech", "programming"]);
    const publishedAt = new Date("2023-01-01T00:00:00Z");
    const lastPublishedAt = new Date("2023-01-02T00:00:00Z");
    const excerpt = "This is a sample excerpt";
    const featuredImage = "https://example.com/image.jpg";
    const language = languageSchema.parse("ja");
    const readingTime = 5;

    // 操作
    const result = createContentMetadata({
      tags,
      categories,
      publishedAt,
      lastPublishedAt,
      excerpt,
      featuredImage,
      language,
      readingTime,
    });

    // アサーション
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const metadata = result.value;
      expect(metadata.tags).toEqual(tags);
      expect(metadata.categories).toEqual(categories);
      expect(metadata.publishedAt).toEqual(publishedAt);
      expect(metadata.lastPublishedAt).toEqual(lastPublishedAt);
      expect(metadata.excerpt).toEqual(excerpt);
      expect(metadata.featuredImage).toEqual(featuredImage);
      expect(metadata.language).toEqual(language);
      expect(metadata.readingTime).toEqual(readingTime);
    }
  });

  it("必須プロパティのみで作成できること", () => {
    // 期待する結果
    const tags = tagsSchema.parse(["markdown"]);
    const categories = categoriesSchema.parse(["blog"]);
    const language = languageSchema.parse("en");

    // 操作
    const result = createContentMetadata({
      tags,
      categories,
      language,
    });

    // アサーション
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const metadata = result.value;
      expect(metadata.tags).toEqual(tags);
      expect(metadata.categories).toEqual(categories);
      expect(metadata.language).toEqual(language);
      expect(metadata.publishedAt).toBeUndefined();
      expect(metadata.lastPublishedAt).toBeUndefined();
      expect(metadata.excerpt).toBeUndefined();
      expect(metadata.featuredImage).toBeUndefined();
      expect(metadata.readingTime).toBeUndefined();
    }
  });

  it("タグが空の配列の場合でも作成できること", () => {
    // 操作
    const result = createContentMetadata({
      tags: tagsSchema.parse([]),
      categories: categoriesSchema.parse(["blog"]),
      language: languageSchema.parse("en"),
    });

    // アサーション
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const metadata = result.value;
      expect(metadata.tags).toEqual([]);
      expect(metadata.tags.length).toBe(0);
    }
  });

  it("カテゴリが空の配列の場合でも作成できること", () => {
    // 操作
    const result = createContentMetadata({
      tags: tagsSchema.parse(["markdown"]),
      categories: categoriesSchema.parse([]),
      language: languageSchema.parse("en"),
    });

    // アサーション
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const metadata = result.value;
      expect(metadata.categories).toEqual([]);
      expect(metadata.categories.length).toBe(0);
    }
  });

  it("言語が空文字列の場合はエラーになること", () => {
    // 空の言語
    const result = createContentMetadata({
      tags: ["markdown"],
      categories: ["blog"],
      // 型チェックをバイパスするために型アサーションを使用
      language: "" as unknown as string,
    });

    // アサーション
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      // エラーメッセージに「言語」という文字列が含まれていることを確認
      expect(result.error.message.includes("language")).toBe(true);
    }
  });

  it("無効な言語の場合はエラーをスローする", () => {
    // 無効な言語
    const result = createContentMetadata({
      tags: ["test"],
      categories: ["test"],
      // 型チェックをバイパスするために型アサーションを使用
      language: "invalid-language" as unknown as string,
    });

    // アサーション
    expect(result.isErr()).toBe(true);
  });
}); 