import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { DrizzlePostRepository } from "@/infrastructure/db/repositories/post/post-repository";
import { PGlite } from "@electric-sql/pglite";
import { errAsync, okAsync } from "@/lib/result";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { GetEngagementService } from "../get-engagement";

// データベース関連の変数
let client: PGlite;
let postRepository: DrizzlePostRepository;
let db: ReturnType<typeof getTestDatabase>;

// BlueskyPostProviderのモック
const mockBlueskyPostProvider = {
  createPost: vi.fn(),
  getEngagement: vi.fn(),
};

// テスト用データ
const testPostUri = "at://did:plc:testuser123/app.bsky.feed.post/1234";
const testEngagement = {
  likes: 25,
  reposts: 10,
  quotes: 2,
  replies: 5,
};

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  db = getTestDatabase(client);
  postRepository = new DrizzlePostRepository(db);

  // BlueskyPostProviderのモックをリセット
  vi.resetAllMocks();
});

afterEach(async () => {
  await cleanupTestDatabase(client);
  await closeTestDatabase(client);
});

test("エンゲージメント情報が正常に取得できた場合に成功結果が返されること", async () => {
  // Blueskyエンゲージメントモックの設定
  mockBlueskyPostProvider.getEngagement.mockReturnValue(
    okAsync(testEngagement),
  );

  // テスト対象のサービスを作成
  const service = new GetEngagementService({
    deps: {
      blueskyPostProvider: mockBlueskyPostProvider,
    },
  });

  // 実行
  const result = await service.execute({
    uri: testPostUri,
  });

  // 検証
  expect(mockBlueskyPostProvider.getEngagement).toHaveBeenCalledWith(
    testPostUri,
  );
  expect(result.isOk()).toBe(true);

  if (result.isOk()) {
    const engagement = result.value;
    expect(engagement.replies).toBe(testEngagement.replies);
    expect(engagement.reposts).toBe(testEngagement.reposts);
    expect(engagement.likes).toBe(testEngagement.likes);
    expect(engagement.quotes).toBe(testEngagement.quotes);
  }
});

test("エンゲージメント情報の取得に失敗した場合にエラーが返されること", async () => {
  // エンゲージメント取得失敗時のエラー
  const engagementError = new ExternalServiceError(
    "Bluesky",
    ExternalServiceErrorCode.RESPONSE_INVALID,
    "エンゲージメント情報の取得に失敗しました",
  );

  // Blueskyエンゲージメントモックの設定
  mockBlueskyPostProvider.getEngagement.mockReturnValue(
    errAsync(engagementError),
  );

  // テスト対象のサービスを作成
  const service = new GetEngagementService({
    deps: {
      blueskyPostProvider: mockBlueskyPostProvider,
    },
  });

  // 実行
  const result = await service.execute({
    uri: testPostUri,
  });

  // 検証
  expect(mockBlueskyPostProvider.getEngagement).toHaveBeenCalledWith(
    testPostUri,
  );
  expect(result.isErr()).toBe(true);

  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
    );
  }
});

