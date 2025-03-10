import {
  Result,
  ok,
  err,
  expect,
  describe,
  it,
  DomainError,
  ApplicationError,
  InfrastructureError,
  ValidationError,
  PageAggregate,
  PageMetadata,
  RenderingOptions,
  EntityNotFoundError
} from "../__tests__/deps/mod.ts";

import type {
  Page,
  PageRepository
} from "../__tests__/deps/mod.ts";

import { GetPageByIdQueryHandler } from "./get-page-by-id-query.ts";

/**
 * GetPageByIdQueryのテスト
 */
describe("GetPageByIdQuery", () => {
  // モックリポジトリ
  const mockPageRepository: PageRepository = {
    findById: (id: string) => {
      if (id === "existing-id") {
        // Pageエンティティを作成
        const page = {
          id: "existing-id",
          slug: "test-page",
          contentId: "content-id",
          templateId: "template-id",
          title: "Test Page",
          content: "Test content",
          metadata: new PageMetadata({
            description: "Test description",
            keywords: ["test", "page"],
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
          updateTitle: function(title: string) { return this; },
          updateContent: function(content: string) { return this; },
          updateSlug: function(slug: string) { return this; },
          changeTemplate: function(templateId: string) { return this; },
          updateMetadata: function(metadata: PageMetadata) { return this; },
          updateRenderingOptions: function(options: RenderingOptions) { return this; }
        } as PageAggregate;
        
        return Promise.resolve(ok(page));
      } else if (id === "error-id") {
        return Promise.resolve(err(new DomainError("Page not found")));
      }
      
      return Promise.resolve(ok(null));
    },
    findBySlug: () => Promise.resolve(ok(null)),
    findByContentId: () => Promise.resolve(ok(null)),
    save: () => Promise.resolve(ok(undefined)),
    saveWithTransaction: () => Promise.resolve(ok(undefined)),
    delete: () => Promise.resolve(ok(undefined)),
    deleteWithTransaction: () => Promise.resolve(ok(undefined))
  };
  
  // GetPageByIdQueryHandlerのインスタンス
  const handler = {
    pageRepository: mockPageRepository,
    execute: async (query: { id: string }) => {
      const result = await mockPageRepository.findById(query.id);
      
      if (result.isErr()) {
        return err(new ApplicationError(`ページの取得に失敗しました: ${result.error.message}`));
      }
      
      const pageAggregate = result.value;
      
      if (!pageAggregate) {
        return err(new ApplicationError(`ID: ${query.id} のページが見つかりません`));
      }
      
      return ok(pageAggregate);
    }
  };
  
  it("存在するIDでページを取得できること", async () => {
    // 操作
    const result = await handler.execute({ id: "existing-id" });
    
    // アサーション
    expect(result.isOk()).toBe(true);
    result.map((pageAggregate) => {
      expect(pageAggregate.id).toBe("existing-id");
      expect(pageAggregate.title).toBe("Test Page");
      expect(pageAggregate.metadata.description).toBe("Test description");
    });
  });
  
  it("存在しないIDでエラーを返すこと", async () => {
    // 操作
    const result = await handler.execute({ id: "non-existing-id" });
    
    // アサーション
    expect(result.isErr()).toBe(true);
    result.mapErr((error) => {
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toContain("non-existing-id");
    });
  });
  
  it("リポジトリエラーを適切に処理すること", async () => {
    // 操作
    const result = await handler.execute({ id: "error-id" });
    
    // アサーション
    expect(result.isErr()).toBe(true);
    result.mapErr((error) => {
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.message).toContain("Repository error");
    });
  });
});

describe("GetPageByIdQueryHandler", () => {
  // トランザクションコンテキストのインターフェース
  interface TransactionContext {
    readonly id: string;
  }

  // モックページリポジトリ
  class MockPageRepository implements PageRepository {
    private pages: Record<string, PageAggregate> = {};
    private shouldError = false;
    
    constructor(initialPages: PageAggregate[] = []) {
      for (const page of initialPages) {
        this.pages[page.page.id] = page;
      }
    }
    
    findById(id: string): Promise<Result<PageAggregate | null, Error>> {
      if (this.shouldError) {
        return Promise.resolve(err(new Error("データベースエラー")));
      }
      
      return Promise.resolve(ok(this.pages[id] || null));
    }
    
    findBySlug(slug: string): Promise<Result<PageAggregate | null, Error>> {
      if (this.shouldError) {
        return Promise.resolve(err(new Error("データベースエラー")));
      }
      
      const page = Object.values(this.pages).find(p => p.page.slug === slug);
      return Promise.resolve(ok(page || null));
    }
    
    findByContentId(_contentId: string): Promise<Result<PageAggregate | null, Error>> {
      return Promise.resolve(ok(null));
    }
    
    save(_page: PageAggregate): Promise<Result<void, Error>> {
      return Promise.resolve(ok(undefined));
    }
    
    saveWithTransaction(_page: PageAggregate, _context: TransactionContext): Promise<Result<void, Error>> {
      return Promise.resolve(ok(undefined));
    }
    
    delete(_id: string): Promise<Result<void, Error>> {
      return Promise.resolve(ok(undefined));
    }
    
    deleteWithTransaction(_id: string, _context: TransactionContext): Promise<Result<void, Error>> {
      return Promise.resolve(ok(undefined));
    }
    
    // エラーを発生させるメソッド（テスト用）
    setError(error: Error) {
      this.shouldError = true;
      this.error = error;
    }
    
    private error: Error = new Error("データベースエラー");
  }

  // テスト用のページ集約を作成
  const createTestPage = (id: string): PageAggregate => {
    const now = new Date();
    
    // Pageエンティティを作成
    const page = {
      id,
      contentId: "content-1",
      slug: "test-page",
      title: "Test Page",
      content: "# Test Content",
      templateId: "template-1",
      metadata: new PageMetadata({}),
      createdAt: now,
      updatedAt: now,
      updateTitle: function(title: string) { return this; },
      updateContent: function(content: string) { return this; },
      updateSlug: function(slug: string) { return this; },
      changeTemplate: function(templateId: string) { return this; },
      updateMetadata: function(metadata: PageMetadata) { return this; }
    } as Page;
    
    // レンダリングオプションを作成
    const renderingOptions = RenderingOptions.createDefault ? 
      RenderingOptions.createDefault() : 
      { theme: 'light', codeHighlighting: true } as RenderingOptions;
    
    // PageAggregateを作成
    const pageAggregate = {
      _page: page,
      _renderingOptions: renderingOptions,
      id: page.id,
      contentId: page.contentId,
      slug: page.slug,
      title: page.title,
      content: page.content,
      templateId: page.templateId,
      metadata: page.metadata,
      renderingOptions: renderingOptions,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      page: page,
      updateTitle: function(title: string) { return this; },
      updateContent: function(content: string) { return this; },
      updateSlug: function(slug: string) { return this; },
      changeTemplate: function(templateId: string) { return this; },
      updateMetadata: function(metadata: PageMetadata) { return this; },
      updateRenderingOptions: function(options: Partial<{
        theme: 'light' | 'dark' | 'auto';
        codeHighlighting: boolean;
        tableOfContents: boolean;
        syntaxHighlightingTheme: string;
        renderMath: boolean;
        renderDiagrams: boolean;
      }>) { return this; },
      getCanonicalUrl: function() { return undefined; },
      getLastUpdatedAt: function() { return page.updatedAt; }
    } as unknown as PageAggregate;
    
    return pageAggregate;
  };

  it("存在するIDでページが取得できること", async () => {
    // テスト用のページを作成
    const testPage = createTestPage("page-1");
    const mockRepository = new MockPageRepository([testPage]);
    const handler = new GetPageByIdQueryHandler(mockRepository);

    // クエリを実行
    const result = await handler.execute({ id: "page-1" });

    // 結果を検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBe("page-1");
      expect(result.value.title).toBe("Test Page");
    }
  });

  it("存在しないIDでエラーが返されること", async () => {
    // 空のリポジトリを作成
    const mockRepository = new MockPageRepository();
    const handler = new GetPageByIdQueryHandler(mockRepository);

    // クエリを実行
    const result = await handler.execute({ id: "non-existent" });

    // 結果を検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(EntityNotFoundError);
      expect(result.error.message).toContain("non-existent");
    }
  });

  it("リポジトリでエラーが発生した場合にエラーが返されること", async () => {
    // エラーを発生させるリポジトリを作成
    const mockRepository = new MockPageRepository();
    const testError = new InfrastructureError("Test database error");
    mockRepository.setError(testError);
    const handler = new GetPageByIdQueryHandler(mockRepository);

    // クエリを実行
    const result = await handler.execute({ id: "page-1" });

    // 結果を検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Failed to get page");
      expect(result.error.message).toContain("Test database error");
    }
  });
}); 