import { expect, test, vi, beforeEach } from "vitest";
import { ValidateSessionService } from "../validate-session";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { SessionData } from "@/domain/account/models/session-data";
import type { RequestContext } from "@/domain/types/http";
import type { IncomingMessage, ServerResponse } from "node:http";

// モックの作成
const mockAuthProvider = {
  authorize: vi.fn(),
  callback: vi.fn(),
  getUserProfile: vi.fn(),
  validateSession: vi.fn(),
};

const mockSessionManager = {
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
};

const mockContext: RequestContext = {
  req: {} as IncomingMessage,
  res: {} as ServerResponse<IncomingMessage>,
};

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なセッションの場合にセッションデータが返されること", async () => {
  // テストの準備
  const sessionData: SessionData = {
    did: "valid-did",
  };
  mockSessionManager.get.mockReturnValue(okAsync(sessionData));
  mockAuthProvider.validateSession.mockReturnValue(okAsync(sessionData));

  const service = new ValidateSessionService({
    deps: {
      authProvider: mockAuthProvider,
      sessionManager: mockSessionManager,
    },
  });

  // 実行
  const result = await service.execute({ context: mockContext });

  // 検証
  expect(mockSessionManager.get).toHaveBeenCalledWith(mockContext);
  expect(mockAuthProvider.validateSession).toHaveBeenCalledWith(
    sessionData.did,
  );
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(sessionData);
  }
});

test("セッションが存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const providerError = new ExternalServiceError(
    "SessionManager",
    ExternalServiceErrorCode.REQUEST_FAILED,
    "Failed to get session",
  );
  mockSessionManager.get.mockReturnValue(errAsync(providerError));

  const service = new ValidateSessionService({
    deps: {
      authProvider: mockAuthProvider,
      sessionManager: mockSessionManager,
    },
  });

  // 実行
  const result = await service.execute({ context: mockContext });

  // 検証
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
  // テストの準備
  const sessionData: SessionData = {
    did: "invalid-did",
  };
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.AUTHENTICATION_FAILED,
    "Failed to validate session",
  );
  mockSessionManager.get.mockReturnValue(okAsync(sessionData));
  mockAuthProvider.validateSession.mockReturnValue(errAsync(providerError));

  const service = new ValidateSessionService({
    deps: {
      authProvider: mockAuthProvider,
      sessionManager: mockSessionManager,
    },
  });

  // 実行
  const result = await service.execute({ context: mockContext });

  // 検証
  expect(mockSessionManager.get).toHaveBeenCalledWith(mockContext);
  expect(mockAuthProvider.validateSession).toHaveBeenCalledWith(
    sessionData.did,
  );
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});

