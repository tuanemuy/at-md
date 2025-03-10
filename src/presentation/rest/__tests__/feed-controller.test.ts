/**
 * フィードコントローラーのテスト
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { beforeEach, describe, it } from "https://deno.land/std/testing/bdd.ts";
import { spy, assertSpyCalls } from "https://deno.land/std/testing/mock.ts";

import {
  Result,
  ok,
  err,
  ApplicationError,
  EntityNotFoundError,
  createNewFeedAggregate,
  type FeedAggregate,
  type Feed,
  type FeedMetadata,
  type FeedRepository
} from "./deps.ts";

import { FeedController } from "../controllers/feed-controller.ts";

describe("FeedController", () => {
  let feedRepository: FeedRepository;
  let controller: FeedController;
  
  beforeEach(() => {
    // モックリポジトリの作成
    feedRepository = {
      findById: spy(() => Promise.resolve(null)),
      findBySlug: spy(() => Promise.resolve(null)),
      findByUserId: spy((_userId: string, _options?: { limit?: number; offset?: number; }) => Promise.resolve([])),
      save: spy((feed: FeedAggregate) => Promise.resolve(feed)),
      delete: spy(() => Promise.resolve(true))
    } as unknown as FeedRepository;
    
    // コントローラーの作成
    controller = new FeedController(feedRepository);
  });
  
  describe("getFeedById", () => {
    it("存在するIDの場合はフィードを返す", async () => {
      // テスト用のフィードを作成
      const testFeed = createNewFeedAggregate({
        id: "test-feed-id",
        userId: "test-user-id",
        name: "テストフィード",
        description: "テストフィードの説明",
        metadata: {
          keywords: ["test", "feed"]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (feedRepository.findById as unknown as ReturnType<typeof spy>).mock.mockImplementation(() => Promise.resolve(testFeed));
      
      // コントローラーのメソッドを呼び出す
      const result = await controller.getFeedById("test-feed-id");
      
      // 結果を検証
      assertEquals(result.isOk(), true);
      
      // リポジトリのメソッドが正しく呼び出されたことを確認
      assertSpyCalls(feedRepository.findById as unknown as ReturnType<typeof spy>, 1);
      
      // 結果のフィードを検証
      result.map(feed => {
        assertEquals(feed.id, "test-feed-id");
        assertEquals(feed.title, "テストフィード");
      });
    });
    
    it("存在しないIDの場合はエラーを返す", async () => {
      // テスト実行
      const result = await controller.getFeedById("non-existent-id");
      
      // リポジトリが呼び出されたことを確認
      assertSpyCalls(feedRepository.findById as unknown as ReturnType<typeof spy>, 1);
      
      // 結果を検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof EntityNotFoundError, true);
      }
    });
    
    it("リポジトリがエラーを投げた場合はエラーを返す", async () => {
      // リポジトリがエラーを投げるようにモックを設定
      const testError = new Error("テストエラー");
      (feedRepository.findById as unknown as ReturnType<typeof spy>).mock.mockImplementation(() => Promise.reject(testError));
      
      // テスト実行
      const result = await controller.getFeedById("test-feed-id");
      
      // 結果を検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof ApplicationError, true);
      }
    });
  });
  
  describe("getFeedBySlug", () => {
    it("スラッグによってフィードを取得できる", async () => {
      // モックの戻り値を設定
      const testFeed = createNewFeedAggregate({
        id: "test-feed-id",
        slug: "test-feed",
        title: "テストフィード",
        description: "テストフィードの説明",
        metadata: {
          keywords: ["test", "feed"]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (feedRepository.findBySlug as unknown as ReturnType<typeof spy>).mock.mockImplementation(() => Promise.resolve(testFeed));
      
      // テスト実行
      const result = await controller.getFeedBySlug("test-feed");
      
      // リポジトリが呼び出されたことを確認
      assertSpyCalls(feedRepository.findBySlug as unknown as ReturnType<typeof spy>, 1);
      
      // 結果を検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        assertEquals(result.value.id, "test-feed-id");
        assertEquals(result.value.slug, "test-feed");
        assertEquals(result.value.title, "テストフィード");
      }
    });
    
    it("存在しないスラッグの場合はエラーを返す", async () => {
      // テスト実行
      const result = await controller.getFeedBySlug("non-existent-slug");
      
      // リポジトリが呼び出されたことを確認
      assertSpyCalls(feedRepository.findBySlug as unknown as ReturnType<typeof spy>, 1);
      
      // 結果を検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof EntityNotFoundError, true);
      }
    });
  });
  
  describe("createFeed", () => {
    it("有効なデータでフィードを作成する", async () => {
      // テスト用のフィードデータ
      const feedData = {
        userId: "test-user-id",
        name: "新しいフィード",
        description: "新しいフィードの説明",
        isPublic: true
      };
      
      // 作成されるフィードを模擬
      const createdFeed = createNewFeedAggregate({
        id: "new-feed-id",
        userId: feedData.userId,
        name: feedData.name,
        description: feedData.description,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // リポジトリのモックを設定
      (feedRepository.save as unknown as ReturnType<typeof spy>).mock.mockImplementation(() => Promise.resolve(createdFeed));
      
      // テスト実行
      const result = await controller.createFeed(feedData);
      
      // 結果を検証
      assertEquals(result.isOk(), true);
      
      // リポジトリのメソッドが正しく呼び出されたことを確認
      assertSpyCalls(feedRepository.save as unknown as ReturnType<typeof spy>, 1);
      
      // 結果のフィードを検証
      result.map(feed => {
        assertEquals(feed.id, "new-feed-id");
        assertEquals(feed.userId, "test-user-id");
        assertEquals(feed.name, "新しいフィード");
      });
    });
    
    it("必須フィールドが欠けている場合はエラーを返す", async () => {
      // 不完全なデータ
      const incompleteData = {
        // userIdが欠けている
        name: "新しいフィード"
      };
      
      // テスト実行
      const result = await controller.createFeed(incompleteData);
      
      // 結果を検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof ValidationError, true);
      }
    });
    
    it("リポジトリがエラーを投げた場合はエラーを返す", async () => {
      // テスト用のフィードデータ
      const feedData = {
        userId: "test-user-id",
        name: "新しいフィード",
        description: "新しいフィードの説明"
      };
      
      // リポジトリがエラーを投げるようにモックを設定
      const testError = new Error("テストエラー");
      (feedRepository.save as unknown as ReturnType<typeof spy>).mock.mockImplementation(() => Promise.reject(testError));
      
      // テスト実行
      const result = await controller.createFeed(feedData);
      
      // 結果を検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof ApplicationError, true);
      }
    });
  });
  
  describe("updateFeed", () => {
    it("既存のフィードを更新できる", async () => {
      // モックの戻り値を設定
      const testFeed = createNewFeedAggregate({
        id: "test-feed-id",
        slug: "test-feed",
        title: "テストフィード",
        description: "テストフィードの説明",
        metadata: {
          keywords: ["test", "feed"]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (feedRepository.findById as unknown as ReturnType<typeof spy>).mock.mockImplementation(() => Promise.resolve(testFeed));
      
      // テスト用のDTOを作成
      const dto = {
        title: "更新されたフィード",
        description: "更新されたフィードの説明"
      };
      
      // テスト実行
      const result = await controller.updateFeed("test-feed-id", dto);
      
      // リポジトリが呼び出されたことを確認
      assertSpyCalls(feedRepository.findById as unknown as ReturnType<typeof spy>, 1);
      assertSpyCalls(feedRepository.save as unknown as ReturnType<typeof spy>, 1);
      
      // 結果を検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        assertEquals(result.value.id, "test-feed-id");
        assertEquals(result.value.title, "更新されたフィード");
        assertEquals(result.value.description, "更新されたフィードの説明");
      }
    });
    
    it("存在しないIDの場合はエラーを返す", async () => {
      // テスト用のDTOを作成
      const dto = {
        title: "更新されたフィード"
      };
      
      // テスト実行
      const result = await controller.updateFeed("non-existent-id", dto);
      
      // リポジトリが呼び出されたことを確認
      assertSpyCalls(feedRepository.findById as unknown as ReturnType<typeof spy>, 1);
      assertSpyCalls(feedRepository.save as unknown as ReturnType<typeof spy>, 0);
      
      // 結果を検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof EntityNotFoundError, true);
      }
    });
  });
  
  describe("deleteFeed", () => {
    it("フィードを削除できる", async () => {
      // モックの戻り値を設定
      const testFeed = createNewFeedAggregate({
        id: "test-feed-id",
        slug: "test-feed",
        title: "テストフィード",
        description: "テストフィードの説明",
        metadata: {
          keywords: ["test", "feed"]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      (feedRepository.findById as unknown as ReturnType<typeof spy>).mock.mockImplementation(() => Promise.resolve(testFeed));
      
      // テスト実行
      const result = await controller.deleteFeed("test-feed-id");
      
      // リポジトリが呼び出されたことを確認
      assertSpyCalls(feedRepository.findById as unknown as ReturnType<typeof spy>, 1);
      assertSpyCalls(feedRepository.delete as unknown as ReturnType<typeof spy>, 1);
      
      // 結果を検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        assertEquals(result.value, true);
      }
    });
    
    it("存在しないIDの場合はエラーを返す", async () => {
      // テスト実行
      const result = await controller.deleteFeed("non-existent-id");
      
      // リポジトリが呼び出されたことを確認
      assertSpyCalls(feedRepository.findById as unknown as ReturnType<typeof spy>, 1);
      assertSpyCalls(feedRepository.delete as unknown as ReturnType<typeof spy>, 0);
      
      // 結果を検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof EntityNotFoundError, true);
      }
    });
  });
}); 