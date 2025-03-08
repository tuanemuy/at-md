import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { err, ok } from "npm:neverthrow";
import { EntityNotFoundError } from "../../../../core/errors/application.ts";
import { PresentationError } from "../../../../core/errors/base.ts";
import { Page } from "../../../../core/display/entities/page.ts";
import { PageMetadata } from "../../../../core/display/value-objects/page-metadata.ts";
import { PageAggregate } from "../../../../core/display/aggregates/page-aggregate.ts";
import { 
  GetPageByIdQueryHandler,
  GetPageBySlugQueryHandler,
  GetPageByContentIdQueryHandler
} from "../../../../application/display/queries/mod.ts";
import { PageController } from "../page-controller.ts";
import { PageDto } from "../../dtos/page-dto.ts";

// モックハンドラーを作成するヘルパー関数
function createMockQueryHandler<T, U>(returnValue: T) {
  return {
    execute: () => Promise.resolve(ok(returnValue))
  } as unknown as U;
}

// エラーを返すモックハンドラーを作成するヘルパー関数
function createErrorMockQueryHandler<U>(error: Error) {
  return {
    execute: () => Promise.resolve(err(error))
  } as unknown as U;
}

describe("PageController", () => {
  let pageController: PageController;
  let mockGetPageByIdQueryHandler: GetPageByIdQueryHandler;
  let mockGetPageBySlugQueryHandler: GetPageBySlugQueryHandler;
  let mockGetPageByContentIdQueryHandler: GetPageByContentIdQueryHandler;
  let testPage: Page;
  let testPageAggregate: PageAggregate;

  beforeEach(() => {
    // テスト用のページを作成
    const now = new Date();
    const metadata = new PageMetadata({
      description: "テスト説明",
    });

    testPage = new Page({
      id: "page-1",
      contentId: "content-1",
      slug: "test-page",
      title: "テストページ",
      content: "# テスト\nこれはテストです。",
      templateId: "template-1",
      metadata: metadata,
      createdAt: now,
      updatedAt: now
    });

    testPageAggregate = {
      page: testPage
    } as PageAggregate;

    // モックハンドラーを作成
    mockGetPageByIdQueryHandler = createMockQueryHandler<PageAggregate, GetPageByIdQueryHandler>(testPageAggregate);
    mockGetPageBySlugQueryHandler = createMockQueryHandler<PageAggregate, GetPageBySlugQueryHandler>(testPageAggregate);
    mockGetPageByContentIdQueryHandler = createMockQueryHandler<PageAggregate, GetPageByContentIdQueryHandler>(testPageAggregate);

    // コントローラーを作成
    pageController = new PageController(
      mockGetPageByIdQueryHandler,
      mockGetPageBySlugQueryHandler,
      mockGetPageByContentIdQueryHandler
    );
  });

  describe("getPageById", () => {
    it("有効なIDでページを取得できること", async () => {
      // テスト実行
      const result = await pageController.getPageById("page-1");

      // 結果を検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const pageDto = result.value;
        expect(pageDto.id).toBe("page-1");
        expect(pageDto.title).toBe("テストページ");
      }
    });

    it("IDが空の場合はエラーを返すこと", async () => {
      // テスト実行
      const result = await pageController.getPageById("");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PresentationError);
        expect(result.error.message).toContain("Page ID is required");
      }
    });

    it("ページが見つからない場合はEntityNotFoundErrorを返すこと", async () => {
      // エラーを返すモックハンドラーを作成
      const notFoundError = new EntityNotFoundError("Page", "not-found");
      const errorHandler = createErrorMockQueryHandler<GetPageByIdQueryHandler>(notFoundError);
      
      // エラーを返すハンドラーでコントローラーを作成
      const errorController = new PageController(
        errorHandler,
        mockGetPageBySlugQueryHandler,
        mockGetPageByContentIdQueryHandler
      );

      // テスト実行
      const result = await errorController.getPageById("not-found");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityNotFoundError);
      }
    });

    it("その他のエラーが発生した場合はPresentationErrorを返すこと", async () => {
      // エラーを返すモックハンドラーを作成
      const otherError = new Error("その他のエラー");
      const errorHandler = createErrorMockQueryHandler<GetPageByIdQueryHandler>(otherError);
      
      // エラーを返すハンドラーでコントローラーを作成
      const errorController = new PageController(
        errorHandler,
        mockGetPageBySlugQueryHandler,
        mockGetPageByContentIdQueryHandler
      );

      // テスト実行
      const result = await errorController.getPageById("page-1");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PresentationError);
        expect(result.error.message).toContain("Failed to get page");
        expect(result.error.message).toContain("その他のエラー");
      }
    });
  });

  describe("getPageBySlug", () => {
    it("有効なスラッグでページを取得できること", async () => {
      // テスト実行
      const result = await pageController.getPageBySlug("test-page");

      // 結果を検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const pageDto = result.value;
        expect(pageDto.slug).toBe("test-page");
        expect(pageDto.title).toBe("テストページ");
      }
    });

    it("スラッグが空の場合はエラーを返すこと", async () => {
      // テスト実行
      const result = await pageController.getPageBySlug("");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PresentationError);
        expect(result.error.message).toContain("Page slug is required");
      }
    });

    it("ページが見つからない場合はEntityNotFoundErrorを返すこと", async () => {
      // エラーを返すモックハンドラーを作成
      const notFoundError = new EntityNotFoundError("Page", "not-found");
      const errorHandler = createErrorMockQueryHandler<GetPageBySlugQueryHandler>(notFoundError);
      
      // エラーを返すハンドラーでコントローラーを作成
      const errorController = new PageController(
        mockGetPageByIdQueryHandler,
        errorHandler,
        mockGetPageByContentIdQueryHandler
      );

      // テスト実行
      const result = await errorController.getPageBySlug("not-found");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityNotFoundError);
      }
    });

    it("その他のエラーが発生した場合はPresentationErrorを返すこと", async () => {
      // エラーを返すモックハンドラーを作成
      const otherError = new Error("その他のエラー");
      const errorHandler = createErrorMockQueryHandler<GetPageBySlugQueryHandler>(otherError);
      
      // エラーを返すハンドラーでコントローラーを作成
      const errorController = new PageController(
        mockGetPageByIdQueryHandler,
        errorHandler,
        mockGetPageByContentIdQueryHandler
      );

      // テスト実行
      const result = await errorController.getPageBySlug("test-page");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PresentationError);
        expect(result.error.message).toContain("Failed to get page");
        expect(result.error.message).toContain("その他のエラー");
      }
    });
  });

  describe("getPageByContentId", () => {
    it("有効なコンテンツIDでページを取得できること", async () => {
      // テスト実行
      const result = await pageController.getPageByContentId("content-1");

      // 結果を検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const pageDto = result.value;
        expect(pageDto.contentId).toBe("content-1");
        expect(pageDto.title).toBe("テストページ");
      }
    });

    it("コンテンツIDが空の場合はエラーを返すこと", async () => {
      // テスト実行
      const result = await pageController.getPageByContentId("");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PresentationError);
        expect(result.error.message).toContain("Content ID is required");
      }
    });

    it("ページが見つからない場合はEntityNotFoundErrorを返すこと", async () => {
      // エラーを返すモックハンドラーを作成
      const notFoundError = new EntityNotFoundError("Page", "not-found");
      const errorHandler = createErrorMockQueryHandler<GetPageByContentIdQueryHandler>(notFoundError);
      
      // エラーを返すハンドラーでコントローラーを作成
      const errorController = new PageController(
        mockGetPageByIdQueryHandler,
        mockGetPageBySlugQueryHandler,
        errorHandler
      );

      // テスト実行
      const result = await errorController.getPageByContentId("not-found");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityNotFoundError);
      }
    });

    it("その他のエラーが発生した場合はPresentationErrorを返すこと", async () => {
      // エラーを返すモックハンドラーを作成
      const otherError = new Error("その他のエラー");
      const errorHandler = createErrorMockQueryHandler<GetPageByContentIdQueryHandler>(otherError);
      
      // エラーを返すハンドラーでコントローラーを作成
      const errorController = new PageController(
        mockGetPageByIdQueryHandler,
        mockGetPageBySlugQueryHandler,
        errorHandler
      );

      // テスト実行
      const result = await errorController.getPageByContentId("content-1");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PresentationError);
        expect(result.error.message).toContain("Failed to get page");
        expect(result.error.message).toContain("その他のエラー");
      }
    });
  });
}); 