import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type { Profile } from "@/domain/account/models";
import type { User } from "@/domain/account/models/user";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { errAsync, okAsync } from "@/lib/result";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { HandleBlueskyAuthCallbackService } from "../handle-bluesky-auth-callback";

// BlueskyAuthProviderのモック（外部サービス）
const mockAuthProvider = {
  authorize: vi.fn(),
  callback: vi.fn(),
  getUserProfile: vi.fn(),
  validateSession: vi.fn(),
} as unknown as BlueskyAuthProvider;

// URLSearchParamsのモック
const mockParams = new URLSearchParams();
mockParams.append("code", "test-code");
mockParams.append("state", "test-state");

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

test("既存ユーザーの場合にセッションが返されること", async () => {
  // テスト用のユーザーをデータベースに作成
  const did = `did:plc:${generateId("DID")}`;
  const profile: Profile = {
    displayName: "Existing User",
    description: "Test description",
    avatarUrl: "https://example.com/avatar.jpg",
    bannerUrl: "https://example.com/banner.jpg",
  };

  const createUserResult = await userRepository.create({
    did,
    profile,
  });
  expect(createUserResult.isOk()).toBe(true);

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.callback as any).mockReturnValue(okAsync(did));
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.getUserProfile as any).mockReturnValue(okAsync(profile));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository,
    },
  });

  const result = await service.execute({ params: mockParams });

  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(result.isOk()).toBe(true);

  // userRepository.createが呼ばれていないことを確認するために、
  // データベース内のユーザー数が1のままであることを確認
  const findResult = await userRepository.findByDid(did);
  expect(findResult.isOk()).toBe(true);
});

test("新規ユーザーの場合にユーザーが作成されること", async () => {
  const did = `did:plc:${generateId("DID")}`;
  const profile: Profile = {
    displayName: "New User",
    description: "Test description",
    avatarUrl: "https://example.com/avatar.jpg",
    bannerUrl: "https://example.com/banner.jpg",
  };

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.callback as any).mockReturnValue(okAsync(did));
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.getUserProfile as any).mockReturnValue(okAsync(profile));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository,
    },
  });

  // この時点ではユーザーが存在しないことを確認
  const findBeforeResult = await userRepository.findByDid(did);
  expect(findBeforeResult.isErr()).toBe(true);

  const result = await service.execute({ params: mockParams });

  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(mockAuthProvider.getUserProfile).toHaveBeenCalledWith(did);
  expect(result.isOk()).toBe(true);

  // ユーザーが作成されたことを確認
  const findAfterResult = await userRepository.findByDid(did);
  expect(findAfterResult.isOk()).toBe(true);
  if (findAfterResult.isOk()) {
    expect(findAfterResult.value.did).toBe(did);
    expect(findAfterResult.value.profile.displayName).toBe(profile.displayName);
    expect(findAfterResult.value.profile.description).toBe(profile.description);
    expect(findAfterResult.value.profile.avatarUrl).toBe(profile.avatarUrl);
    expect(findAfterResult.value.profile.bannerUrl).toBe(profile.bannerUrl);
  }
});

test("コールバック処理に失敗した場合にエラーが返されること", async () => {
  const errorId = generateId("Error");
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.AUTHENTICATION_FAILED,
    `Failed to handle callback (${errorId})`,
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.callback as any).mockReturnValue(errAsync(providerError));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository,
    },
  });

  const result = await service.execute({ params: mockParams });

  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});

test("ユーザー情報の取得に失敗した場合にエラーが返されること", async () => {
  const did = `did:plc:${generateId("DID")}`;
  const errorId = generateId("Error");
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.REQUEST_FAILED,
    `Failed to get user profile (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.callback as any).mockReturnValue(okAsync(did));
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.getUserProfile as any).mockReturnValue(
    errAsync(providerError),
  );

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository,
    },
  });

  const result = await service.execute({ params: mockParams });

  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(mockAuthProvider.getUserProfile).toHaveBeenCalledWith(did);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});
