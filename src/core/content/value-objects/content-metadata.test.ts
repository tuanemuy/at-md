import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { ContentMetadata, createContentMetadata } from "./content-metadata.ts";

describe("ContentMetadata値オブジェクト", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    // 期待する結果
    const tags = ["markdown", "blog"];
    const categories = ["tech", "programming"];
    const publishedAt = new Date("2023-01-01T00:00:00Z");
    const lastPublishedAt = new Date("2023-01-02T00:00:00Z");
    const excerpt = "This is a sample excerpt";
    const featuredImage = "https://example.com/image.jpg";
    const language = "ja";
    const readingTime = 5;

    // 操作
    const metadata = createContentMetadata({
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
    expect(metadata.tags).toEqual(tags);
    expect(metadata.categories).toEqual(categories);
    expect(metadata.publishedAt).toEqual(publishedAt);
    expect(metadata.lastPublishedAt).toEqual(lastPublishedAt);
    expect(metadata.excerpt).toEqual(excerpt);
    expect(metadata.featuredImage).toEqual(featuredImage);
    expect(metadata.language).toEqual(language);
    expect(metadata.readingTime).toEqual(readingTime);
  });

  it("必須プロパティのみで作成できること", () => {
    // 期待する結果
    const tags = ["markdown"];
    const categories = ["blog"];
    const language = "en";

    // 操作
    const metadata = createContentMetadata({
      tags,
      categories,
      language,
    });

    // アサーション
    expect(metadata.tags).toEqual(tags);
    expect(metadata.categories).toEqual(categories);
    expect(metadata.language).toEqual(language);
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
    }).toThrow("言語は必須です");
  });
}); 