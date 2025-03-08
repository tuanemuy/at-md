/**
 * コンテンツ管理フローの統合テスト
 * 
 * コンテンツの作成から表示までの一連のフローをテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { Content } from "../../src/core/content/entities/content.ts";
import { ContentRepository } from "../../src/application/content/repositories/content-repository.ts";
import { CreateContentCommand, CreateContentCommandHandler } from "../../src/application/content/commands/create-content-command.ts";
import { GetContentByIdQuery, GetContentByIdQueryHandler } from "../../src/application/content/queries/get-content-by-id-query.ts";
import { ContentList } from "../../src/presentation/ui/components/content-list.ts";
import { ContentDetail } from "../../src/presentation/ui/components/content-detail.ts";

// インメモリリポジトリの実装
class InMemoryContentRepository implements ContentRepository {
  private contents: Map<string, Content> = new Map();
  
  async createContent(content: Content): Promise<string> {
    this.contents.set(content.id, content);
    return content.id;
  }
  
  async getContentById(id: string): Promise<Content | null> {
    return this.contents.get(id) || null;
  }
  
  async getAllContents(): Promise<Content[]> {
    return Array.from(this.contents.values());
  }
  
  async updateContent(content: Content): Promise<void> {
    this.contents.set(content.id, content);
  }
  
  async deleteContent(id: string): Promise<void> {
    this.contents.delete(id);
  }
  
  async getContentByPath(path: string): Promise<Content | null> {
    for (const content of this.contents.values()) {
      if (content.path === path) {
        return content;
      }
    }
    return null;
  }
}

describe("コンテンツ管理フローの統合テスト", () => {
  let contentRepository: ContentRepository;
  let createContentCommandHandler: CreateContentCommandHandler;
  let getContentByIdQueryHandler: GetContentByIdQueryHandler;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    contentRepository = new InMemoryContentRepository();
    createContentCommandHandler = new CreateContentCommandHandler(contentRepository);
    getContentByIdQueryHandler = new GetContentByIdQueryHandler(contentRepository);
  });
  
  it("コンテンツを作成し、取得し、表示できること", async () => {
    // 1. コンテンツを作成
    const createContentCommand: CreateContentCommand = {
      title: "テスト記事",
      body: "# テスト記事\n\nこれはテスト記事の本文です。",
      path: "/path/to/content",
      visibility: "public",
      tags: ["test", "article"],
    };
    
    const createResult = await createContentCommandHandler.execute(createContentCommand);
    
    // 作成が成功したことを検証
    expect(createResult.isOk()).toBe(true);
    
    // 作成されたコンテンツのIDを取得
    let contentId: string = "";
    createResult.map((id: string) => {
      contentId = id;
    });
    
    expect(contentId).not.toBe("");
    
    // 2. 作成したコンテンツを取得
    const getContentQuery: GetContentByIdQuery = {
      id: contentId,
    };
    
    const getResult = await getContentByIdQueryHandler.execute(getContentQuery);
    
    // 取得が成功したことを検証
    expect(getResult.isOk()).toBe(true);
    
    // 取得したコンテンツの内容を検証
    let content: Content | null = null;
    getResult.map((c: Content) => {
      content = c;
    });
    
    expect(content).not.toBe(null);
    expect(content?.title).toBe("テスト記事");
    expect(content?.body).toBe("# テスト記事\n\nこれはテスト記事の本文です。");
    expect(content?.path).toBe("/path/to/content");
    expect(content?.visibility).toBe("public");
    expect(content?.tags).toEqual(["test", "article"]);
    
    // 3. コンテンツリストコンポーネントでコンテンツを表示
    const contentListProps = {
      contents: [content!],
      onSelect: () => {},
    };
    
    const contentList = new ContentList(contentListProps);
    const listHtml = contentList.render();
    
    // リストにコンテンツが表示されていることを検証
    expect(listHtml.includes("テスト記事")).toBe(true);
    expect(listHtml.includes("test")).toBe(true);
    expect(listHtml.includes("article")).toBe(true);
    
    // 4. コンテンツ詳細コンポーネントでコンテンツを表示
    const contentDetailProps = {
      content: content!,
      onEdit: () => {},
      onDelete: () => {},
    };
    
    const contentDetail = new ContentDetail(contentDetailProps);
    const detailHtml = contentDetail.render();
    
    // 詳細にコンテンツが表示されていることを検証
    expect(detailHtml.includes("テスト記事")).toBe(true);
    expect(detailHtml.includes("これはテスト記事の本文です")).toBe(true);
    expect(detailHtml.includes("test")).toBe(true);
    expect(detailHtml.includes("article")).toBe(true);
  });
}); 