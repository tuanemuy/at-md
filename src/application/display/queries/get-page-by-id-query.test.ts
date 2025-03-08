import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { err, ok, Result } from "npm:neverthrow";
import { EntityNotFoundError } from "../../../core/errors/application.ts";
import { InfrastructureError } from "../../../core/errors/base.ts";
import { PageAggregate } from "../../../core/display/aggregates/page-aggregate.ts";
import { Page } from "../../../core/display/entities/page.ts";
import { PageMetadata } from "../../../core/display/value-objects/page-metadata.ts";
import { RenderingOptions } from "../../../core/display/value-objects/rendering-options.ts";
import { PageRepository, PageRepositoryError } from "../repositories/page-repository.ts";
import { GetPageByIdQueryHandler } from "./get-page-by-id-query.ts";

describe("GetPageByIdQueryHandler", () => {
  // モックページリポジトリの作成
  class MockPageRepository implements PageRepository {
    private pages: Map<string, PageAggregate> = new Map();
    private shouldError = false;
    private error: PageRepositoryError | null = null;

    constructor(pages: PageAggregate[] = []) {
      pages.forEach(page => this.pages.set(page.id, page));
    }

    async findById(id: string): Promise<Result<PageAggregate | null, PageRepositoryError>> {
      if (this.shouldError && this.error) {
        return err(this.error);
      }
      const page = this.pages.get(id);
      return ok(page || null);
    }

    async findBySlug(_slug: string): Promise<Result<PageAggregate | null, PageRepositoryError>> {
      return ok(null);
    }

    async findByContentId(_contentId: string): Promise<Result<PageAggregate | null, PageRepositoryError>> {
      return ok(null);
    }

    async save(_page: PageAggregate): Promise<Result<void, PageRepositoryError>> {
      return ok(undefined);
    }

    async delete(_id: string): Promise<Result<void, PageRepositoryError>> {
      return ok(undefined);
    }

    // エラーを発生させるメソッド（テスト用）
    setError(error: PageRepositoryError) {
      this.shouldError = true;
      this.error = error;
    }
  }

  // テスト用のページ集約を作成
  const createTestPage = (id: string): PageAggregate => {
    const now = new Date();
    const page = new Page({
      id,
      contentId: "content-1",
      slug: "test-page",
      title: "Test Page",
      content: "# Test Content",
      templateId: "template-1",
      metadata: new PageMetadata({}),
      createdAt: now,
      updatedAt: now,
    });
    const renderingOptions = RenderingOptions.createDefault();
    return new PageAggregate(page, renderingOptions);
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