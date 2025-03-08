import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { PageMetadata } from "./page-metadata.ts";

describe("PageMetadata値オブジェクト", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    const now = new Date();
    const metadata = new PageMetadata({
      description: "テスト説明",
      ogImage: "https://example.com/image.jpg",
      keywords: ["test", "example"],
      canonicalUrl: "https://example.com/page",
      publishedAt: now,
      updatedAt: now,
    });

    expect(metadata.description).toBe("テスト説明");
    expect(metadata.ogImage).toBe("https://example.com/image.jpg");
    expect(metadata.keywords).toEqual(["test", "example"]);
    expect(metadata.canonicalUrl).toBe("https://example.com/page");
    expect(metadata.publishedAt).toBe(now);
    expect(metadata.updatedAt).toBe(now);
  });

  it("空のオブジェクトで作成できること", () => {
    const metadata = new PageMetadata({});

    expect(metadata.description).toBeUndefined();
    expect(metadata.ogImage).toBeUndefined();
    expect(metadata.keywords).toBeUndefined();
    expect(metadata.canonicalUrl).toBeUndefined();
    expect(metadata.publishedAt).toBeUndefined();
    expect(metadata.updatedAt).toBeUndefined();
  });

  it("キーワードが配列のコピーとして保存されること", () => {
    const keywords = ["test", "example"];
    const metadata = new PageMetadata({ keywords });

    // 元の配列を変更しても影響を受けないことを確認
    keywords.push("modified");
    
    expect(metadata.keywords).toEqual(["test", "example"]);
    expect(metadata.keywords).not.toBe(keywords); // 参照が異なることを確認
  });

  it("オブジェクトが不変であること", () => {
    const metadata = new PageMetadata({
      description: "テスト説明",
      keywords: ["test"],
    });

    // Object.isFrozenでオブジェクトが凍結されていることを確認
    expect(Object.isFrozen(metadata)).toBe(true);
    
    // キーワード配列も凍結されていることを確認
    if (metadata.keywords) {
      expect(Object.isFrozen(metadata.keywords)).toBe(true);
    }
  });

  it("updateメソッドで新しいインスタンスが作成されること", () => {
    const original = new PageMetadata({
      description: "元の説明",
      keywords: ["original"],
    });

    const updated = original.update({
      description: "更新された説明",
      ogImage: "https://example.com/new-image.jpg",
    });

    // 元のインスタンスは変更されていないこと
    expect(original.description).toBe("元の説明");
    expect(original.ogImage).toBeUndefined();
    expect(original.keywords).toEqual(["original"]);

    // 新しいインスタンスが正しく更新されていること
    expect(updated.description).toBe("更新された説明");
    expect(updated.ogImage).toBe("https://example.com/new-image.jpg");
    expect(updated.keywords).toEqual(["original"]);
    expect(updated).not.toBe(original); // 参照が異なることを確認
  });

  it("equalsメソッドで等価性を正しく比較できること", () => {
    const date1 = new Date(2023, 0, 1);
    const date2 = new Date(2023, 0, 2);
    
    const metadata1 = new PageMetadata({
      description: "説明",
      ogImage: "https://example.com/image.jpg",
      keywords: ["test", "example"],
      canonicalUrl: "https://example.com/page",
      publishedAt: date1,
      updatedAt: date1,
    });

    // 同じ値を持つ別のインスタンス
    const metadata2 = new PageMetadata({
      description: "説明",
      ogImage: "https://example.com/image.jpg",
      keywords: ["test", "example"],
      canonicalUrl: "https://example.com/page",
      publishedAt: date1,
      updatedAt: date1,
    });

    // 異なる値を持つインスタンス
    const metadata3 = new PageMetadata({
      description: "異なる説明",
      ogImage: "https://example.com/image.jpg",
      keywords: ["test", "example"],
      canonicalUrl: "https://example.com/page",
      publishedAt: date1,
      updatedAt: date1,
    });

    const metadata4 = new PageMetadata({
      description: "説明",
      ogImage: "https://example.com/image.jpg",
      keywords: ["test", "different"],
      canonicalUrl: "https://example.com/page",
      publishedAt: date1,
      updatedAt: date1,
    });

    const metadata5 = new PageMetadata({
      description: "説明",
      ogImage: "https://example.com/image.jpg",
      keywords: ["test", "example"],
      canonicalUrl: "https://example.com/page",
      publishedAt: date2,
      updatedAt: date1,
    });

    expect(metadata1.equals(metadata2)).toBe(true);
    expect(metadata1.equals(metadata3)).toBe(false);
    expect(metadata1.equals(metadata4)).toBe(false);
    expect(metadata1.equals(metadata5)).toBe(false);
  });
}); 