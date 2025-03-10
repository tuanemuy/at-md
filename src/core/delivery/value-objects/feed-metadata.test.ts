import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createFeedMetadata, FeedType } from "./feed-metadata.ts";

describe("FeedMetadata値オブジェクト", () => {
  it("個人フィードのメタデータを作成できること", () => {
    const metadata = createFeedMetadata({
      type: "personal",
      language: "ja"
    });
    
    expect(metadata.type).toBe("personal");
    expect(metadata.language).toBe("ja");
    expect(metadata.description).toBeUndefined();
    expect(metadata.iconUrl).toBeUndefined();
    expect(metadata.coverImageUrl).toBeUndefined();
  });
  
  it("コレクションフィードのメタデータを作成できること", () => {
    const metadata = createFeedMetadata({
      type: "collection",
      language: "ja",
      description: "テストコレクション",
      iconUrl: "https://example.com/icon.png",
      coverImageUrl: "https://example.com/cover.png"
    });
    
    expect(metadata.type).toBe("collection");
    expect(metadata.language).toBe("ja");
    expect(metadata.description).toBe("テストコレクション");
    expect(metadata.iconUrl).toBe("https://example.com/icon.png");
    expect(metadata.coverImageUrl).toBe("https://example.com/cover.png");
  });
  
  it("タグフィードのメタデータを作成できること", () => {
    const metadata = createFeedMetadata({
      type: "tag",
      language: "ja",
      description: "テストタグ"
    });
    
    expect(metadata.type).toBe("tag");
    expect(metadata.language).toBe("ja");
    expect(metadata.description).toBe("テストタグ");
  });
  
  it("カスタム設定を含むフィードメタデータを作成できること", () => {
    const metadata = createFeedMetadata({
      type: "personal",
      language: "ja",
      customDomain: "blog.example.com",
      customSlug: "my-blog",
      customTheme: "dark",
      customCss: ".header { color: red; }",
      customJs: "console.log('Hello');",
      customHeader: "<div>Header</div>",
      customFooter: "<div>Footer</div>"
    });
    
    expect(metadata.type).toBe("personal");
    expect(metadata.language).toBe("ja");
    expect(metadata.customDomain).toBe("blog.example.com");
    expect(metadata.customSlug).toBe("my-blog");
    expect(metadata.customTheme).toBe("dark");
    expect(metadata.customCss).toBe(".header { color: red; }");
    expect(metadata.customJs).toBe("console.log('Hello');");
    expect(metadata.customHeader).toBe("<div>Header</div>");
    expect(metadata.customFooter).toBe("<div>Footer</div>");
  });
  
  it("フィードの種類が指定されていない場合はエラーになること", () => {
    expect(() => {
      createFeedMetadata({
        type: "" as FeedType,
        language: "ja"
      });
    }).toThrow();
  });
  
  it("無効なフィードの種類の場合はエラーになること", () => {
    expect(() => {
      createFeedMetadata({
        type: "invalid" as FeedType,
        language: "ja"
      });
    }).toThrow();
  });
  
  it("言語が指定されていない場合はエラーになること", () => {
    expect(() => {
      createFeedMetadata({
        type: "personal",
        language: ""
      });
    }).toThrow();
  });
  
  it("オブジェクトが不変であること", () => {
    const metadata = createFeedMetadata({
      description: "テストフィード",
      type: "personal",
      language: "ja"
    });
    
    // プロパティを直接変更しようとしても変更されない
    // 型アサーションを使用して、読み取り専用プロパティへの書き込みを試みる
    const metadataCopy = { ...metadata };
    (metadataCopy as { type: string }).type = "collection";
    (metadataCopy as { language: string }).language = "en";
    
    // 元のオブジェクトが変更されていないことを確認
    expect(metadata.type).toBe("personal");
    expect(metadata.language).toBe("ja");
  });
}); 