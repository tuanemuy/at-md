/**
 * ページコントローラーのテスト
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { beforeEach, describe, it } from "https://deno.land/std/testing/bdd.ts";
import { spy, assertSpyCalls, Spy } from "https://deno.land/std/testing/mock.ts";

import {
  Result,
  ok,
  err,
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  Page,
  PageMetadata,
  PageAggregate,
  type PageDto,
  type PageRepository,
  type GetPageByIdQuery,
  type GetPageByIdQueryHandler,
  type GetPageBySlugQuery,
  type GetPageBySlugQueryHandler
} from "./deps.ts";

// テスト用のPageControllerImplクラスを定義
class PageControllerImpl {
  constructor(
    private readonly pageRepository: PageRepository,
    private readonly getPageByIdQueryHandler: GetPageByIdQueryHandler,
    private readonly getPageBySlugQueryHandler: GetPageBySlugQueryHandler
  ) {}

  async getPageById(id: string): Promise<Result<PageDto, ApplicationError>> {
    if (!id) {
      return err(new ValidationError("ページIDは必須です", "id"));
    }

    const query: GetPageByIdQuery = { id };
    const result = await this.getPageByIdQueryHandler.execute(query);
    
    if (result.isErr()) {
      return err(result.error);
    }

    return ok(result.value as unknown as PageDto);
  }

  async getPageBySlug(slug: string): Promise<Result<PageDto, ApplicationError>> {
    if (!slug) {
      return err(new ValidationError("ページスラッグは必須です", "slug"));
    }

    const query: GetPageBySlugQuery = { slug };
    const result = await this.getPageBySlugQueryHandler.execute(query);
    
    if (result.isErr()) {
      return err(result.error);
    }

    return ok(result.value as unknown as PageDto);
  }
}

describe("PageControllerImpl", () => {
  let pageRepository: PageRepository;
  let getPageByIdQueryHandler: { execute: Spy<unknown, [GetPageByIdQuery], Promise<Result<Page, ApplicationError>>> };
  let getPageBySlugQueryHandler: { execute: Spy<unknown, [GetPageBySlugQuery], Promise<Result<Page, ApplicationError>>> };
  let controller: PageControllerImpl;
  
  beforeEach(() => {
    // モックリポジトリとハンドラーの作成
    pageRepository = {
      findById: spy(() => Promise.resolve(null)),
      findBySlug: spy(() => Promise.resolve(null)),
      save: spy((page: PageAggregate) => Promise.resolve(page)),
      delete: spy(() => Promise.resolve(true))
    } as unknown as PageRepository;
    
    getPageByIdQueryHandler = {
      execute: spy((query: GetPageByIdQuery) => Promise.resolve(ok({
        id: query.id,
        slug: "test-page",
        title: "テストページ",
        description: "テストページの説明",
        contentId: "test-content-id",
        templateId: "test-template-id",
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Page)))
    };
    
    getPageBySlugQueryHandler = {
      execute: spy((query: GetPageBySlugQuery) => Promise.resolve(ok({
        id: "test-id",
        slug: query.slug,
        title: "テストページ",
        description: "テストページの説明",
        contentId: "test-content-id",
        templateId: "test-template-id",
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as Page)))
    };
    
    // コントローラーの作成
    controller = new PageControllerImpl(
      pageRepository,
      getPageByIdQueryHandler as unknown as GetPageByIdQueryHandler,
      getPageBySlugQueryHandler as unknown as GetPageBySlugQueryHandler
    );
  });
  
  describe("getPageById", () => {
    it("IDによってページを取得できる", async () => {
      const result = await controller.getPageById("test-id");
      
      // ハンドラーが呼び出されたことを確認
      assertSpyCalls(getPageByIdQueryHandler.execute, 1);
      
      // 結果を検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        assertEquals(result.value.id, "test-id");
        assertEquals(result.value.slug, "test-page");
        assertEquals(result.value.title, "テストページ");
      }
    });
    
    it("エラーが発生した場合はエラーを返す", async () => {
      // エラーを返すようにモックを設定
      const originalExecute = getPageByIdQueryHandler.execute;
      getPageByIdQueryHandler.execute = spy((query: GetPageByIdQuery) => Promise.resolve(err(new EntityNotFoundError("Page", "non-existent-id"))));
      
      const result = await controller.getPageById("non-existent-id");
      
      // ハンドラーが呼び出されたことを確認
      assertSpyCalls(getPageByIdQueryHandler.execute, 1);
      
      // 結果を検証
      assertEquals(result.isErr(), true);
      
      // 元に戻す
      getPageByIdQueryHandler.execute = originalExecute;
    });
  });
  
  describe("getPageBySlug", () => {
    it("スラッグによってページを取得できる", async () => {
      const result = await controller.getPageBySlug("test-slug");
      
      // ハンドラーが呼び出されたことを確認
      assertSpyCalls(getPageBySlugQueryHandler.execute, 1);
      
      // 結果を検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        assertEquals(result.value.id, "test-id");
        assertEquals(result.value.slug, "test-slug");
        assertEquals(result.value.title, "テストページ");
      }
    });
    
    it("エラーが発生した場合はエラーを返す", async () => {
      // エラーを返すようにモックを設定
      const originalExecute = getPageBySlugQueryHandler.execute;
      getPageBySlugQueryHandler.execute = spy((query: GetPageBySlugQuery) => Promise.resolve(err(new EntityNotFoundError("Page", "non-existent-slug"))));
      
      const result = await controller.getPageBySlug("non-existent-slug");
      
      // ハンドラーが呼び出されたことを確認
      assertSpyCalls(getPageBySlugQueryHandler.execute, 1);
      
      // 結果を検証
      assertEquals(result.isErr(), true);
      
      // 元に戻す
      getPageBySlugQueryHandler.execute = originalExecute;
    });
  });
}); 