import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { ContentMetadata, createContentMetadata, createTag, createCategory, createLanguageCode } from "./content-metadata.ts";

describe("ContentMetadata値オブジェクト", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    // 期待する結果
    const tagsInput = ["markdown", "blog"];
    const categoriesInput = ["tech", "programming"];
    const publishedAt = new Date("2023-01-01T00:00:00Z");
    const lastPublishedAt = new Date("2023-01-02T00:00:00Z");
    const excerpt = "This is a sample excerpt";
    const featuredImage = "https://example.com/image.jpg";
    const languageInput = "ja";
    const readingTime = 5;

    // 操作
    const metadata = createContentMetadata({
      tags: tagsInput,
      categories: categoriesInput,
      publishedAt,
      lastPublishedAt,
      excerpt,
      featuredImage,
      language: languageInput,
      readingTime,
    });

    // アサーション
    expect(metadata.tags.length).toBe(tagsInput.length);
    expect(metadata.categories.length).toBe(categoriesInput.length);
    expect(metadata.publishedAt).toEqual(publishedAt);
    expect(metadata.lastPublishedAt).toEqual(lastPublishedAt);
    expect(metadata.excerpt).toEqual(excerpt);
    expect(metadata.featuredImage).toEqual(featuredImage);
    expect(metadata.language).toBeDefined();
    expect(metadata.readingTime).toEqual(readingTime);
  });

  it("必須プロパティのみで作成できること", () => {
    // 期待する結果
    const tagsInput = ["markdown"];
    const categoriesInput = ["blog"];
    const languageInput = "en";

    // 操作
    const metadata = createContentMetadata({
      tags: tagsInput,
      categories: categoriesInput,
      language: languageInput,
    });

    // アサーション
    expect(metadata.tags.length).toBe(tagsInput.length);
    expect(metadata.categories.length).toBe(categoriesInput.length);
    expect(metadata.language).toBeDefined();
    expect(metadata.publishedAt).toBeUndefined();
    expect(metadata.lastPublishedAt).toBeUndefined();
    expect(metadata.excerpt).toBeUndefined();
    expect(metadata.featuredImage).toBeUndefined();
    expect(metadata.readingTime).toBeUndefined();
  });

  it("タグが空の配列の場合でも作成できること", () => {
    // 操作
    const metadata = createContentMetadata({
      tags: [],
      categories: ["blog"],
      language: "en",
    });

    // アサーション
    expect(metadata.tags).toEqual([]);
    expect(metadata.tags.length).toBe(0);
  });

  it("カテゴリが空の配列の場合でも作成できること", () => {
    // 操作
    const metadata = createContentMetadata({
      tags: ["markdown"],
      categories: [],
      language: "en",
    });

    // アサーション
    expect(metadata.categories).toEqual([]);
    expect(metadata.categories.length).toBe(0);
  });

  it("言語が指定されていない場合はエラーになること", () => {
    // 操作と検証
    expect(() => {
      createContentMetadata({
        tags: ["markdown"],
        categories: ["blog"],
        language: "",
      });
    }).toThrow("言語コードは必須です");
  });
}); 