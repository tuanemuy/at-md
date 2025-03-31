import type { IncomingMessage, ServerResponse } from "node:http";
import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type { SessionManager } from "@/domain/account/adapters/session-manager";
import type { Profile } from "@/domain/account/models";
import type { SessionData } from "@/domain/account/models/session-data";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { RequestContext } from "@/domain/types/http";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { errAsync, okAsync } from "@/lib/result";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ValidateSessionService } from "../validate-session";

// 外部サービスのモック
const mockAuthProvider = {
  authorize: vi.fn(),
  callback: vi.fn(),
  getUserProfile: vi.fn(),
  validateSession: vi.fn(),
} as unknown as BlueskyAuthProvider;

const mockSessionManager = {
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
} as unknown as SessionManager;

// テスト用のリクエストコンテキスト
const mockContext: RequestContext = {
  req: {} as IncomingMessage,
  res: {} as ServerResponse<IncomingMessage>,
};

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

test("有効なセッションの場合にセッションデータが返されること", async () => {
  // テスト用ユーザーをデータベースに作成
  const did = `did:plc:${generateId("DID")}`;
  const profile: Profile = {
    displayName: "Test User",
    description: "Test description",
    avatarUrl: "https://example.com/avatar.jpg",
    bannerUrl: "https://example.com/banner.jpg",
  };

  const createUserResult = await userRepository.create({
    did,
    profile,
  });
  expect(createUserResult.isOk()).toBe(true);

  // セッションデータ
  const sessionData: SessionData = {
    did,
  };

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockSessionManager.get as any).mockReturnValue(okAsync(sessionData));
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.validateSession as any).mockReturnValue(
    okAsync(sessionData),
  );

  const service = new ValidateSessionService({
    deps: {
      authProvider: mockAuthProvider,
      sessionManager: mockSessionManager,
    },
  });

  const result = await service.execute({ context: mockContext });

  expect(mockSessionManager.get).toHaveBeenCalledWith(mockContext);
  expect(mockAuthProvider.validateSession).toHaveBeenCalledWith(did);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(sessionData);
  }

  // ユーザーがデータベースに存在することを確認
  const findUserResult = await userRepository.findByDid(did);
  expect(findUserResult.isOk()).toBe(true);
});

test("セッションが存在しない場合にエラーが返されること", async () => {
  const errorId = generateId("Error");
  const providerError = new ExternalServiceError(
    "SessionManager",
    ExternalServiceErrorCode.REQUEST_FAILED,
    `Failed to get session (${errorId})`,
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockSessionManager.get as any).mockReturnValue(errAsync(providerError));

  const service = new ValidateSessionService({
    deps: {
      authProvider: mockAuthProvider,
      sessionManager: mockSessionManager,
    },
  });

  const result = await service.execute({ context: mockContext });

  expect(mockSessionManager.get).toHaveBeenCalledWith(mockContext);
  expect(mockAuthProvider.validateSession).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});

test("セッション検証に失敗した場合にエラーが返されること", async () => {
  // テスト用ユーザーをデータベースに作成
  const did = `did:plc:${generateId("DID")}`;
  const profile: Profile = {
    displayName: "Test User",
    description: "Test description",
    avatarUrl: "https://example.com/avatar.jpg",
    bannerUrl: "https://example.com/banner.jpg",
  };

  const createUserResult = await userRepository.create({
    did,
    profile,
  });
  expect(createUserResult.isOk()).toBe(true);

  // セッションデータ
  const sessionData: SessionData = {
    did,
  };

  const errorId = generateId("Error");
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.AUTHENTICATION_FAILED,
    `Failed to validate session (${errorId})`,
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockSessionManager.get as any).mockReturnValue(okAsync(sessionData));
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockAuthProvider.validateSession as any).mockReturnValue(
    errAsync(providerError),
  );

  const service = new ValidateSessionService({
    deps: {
      authProvider: mockAuthProvider,
      sessionManager: mockSessionManager,
    },
  });

  const result = await service.execute({ context: mockContext });

  expect(mockSessionManager.get).toHaveBeenCalledWith(mockContext);
  expect(mockAuthProvider.validateSession).toHaveBeenCalledWith(did);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});
