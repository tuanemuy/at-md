import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { errAsync, okAsync } from "@/lib/result";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { StartBlueskyAuthService } from "../start-bluesky-auth";

// BlueskyAuthProviderはモック（外部サービス）
const mockAuthProvider = {
  authorize: vi.fn(),
  callback: vi.fn(),
  getUserProfile: vi.fn(),
  validateSession: vi.fn(),
} as unknown as BlueskyAuthProvider;

// データベース関連の変数
let client: PGlite;
let userRepository: DrizzleUserRepository;

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  userRepository = new DrizzleUserRepository(db);

  // モックをリセット
  vi.resetAllMocks();
});

afterEach(async () => {
  // テスト用のデータベースをクリーンアップ
  await cleanupTestDatabase(client);
  await closeTestDatabase(client);
});

test("有効なハンドルの場合に認証URLが生成されること", async () => {
  const handle = "valid-handle";
  const expectedUrl = new URL("https://example.com/auth");
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.authorize as any).mockReturnValue(okAsync(expectedUrl));

  const service = new StartBlueskyAuthService({
    deps: {
      authProvider: mockAuthProvider,
    },
  });

  const result = await service.execute({ handle });

  expect(mockAuthProvider.authorize).toHaveBeenCalledWith(handle);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(expectedUrl);
  }
});

test("無効なハンドルの場合にエラーが返されること", async () => {
  const handle = "invalid-handle";
  const errorId = generateId("Error");
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.AUTHENTICATION_FAILED,
    `Invalid handle: ${handle} (${errorId})`,
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.authorize as any).mockReturnValue(errAsync(providerError));

  const service = new StartBlueskyAuthService({
    deps: {
      authProvider: mockAuthProvider,
    },
  });

  const result = await service.execute({ handle });

  expect(mockAuthProvider.authorize).toHaveBeenCalledWith(handle);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});
