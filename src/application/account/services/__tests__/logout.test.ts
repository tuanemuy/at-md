import { expect, test, vi, beforeEach } from "vitest";
import { LogoutService } from "../logout";
import { okAsync, errAsync } from "@/lib/result";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { RequestContext } from "@/domain/types/http";
import type { IncomingMessage, ServerResponse } from "node:http";

// モックの作成
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

test("ログアウト処理が成功した場合にvoidが返されること", async () => {
  // テストの準備
  mockSessionManager.remove.mockReturnValue(okAsync(undefined));

  const service = new LogoutService({
    deps: {
      sessionManager: mockSessionManager,
    },
  });

  // 実行
  const result = await service.execute({ context: mockContext });

  // 検証
  expect(mockSessionManager.remove).toHaveBeenCalledWith(mockContext);
  expect(result.isOk()).toBe(true);
});

test("ログアウト処理が失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const providerError = new ExternalServiceError(
    "SessionManager",
    ExternalServiceErrorCode.REQUEST_FAILED,
    "Failed to remove session",
  );
  mockSessionManager.remove.mockReturnValue(errAsync(providerError));

  const service = new LogoutService({
    deps: {
      sessionManager: mockSessionManager,
    },
  });

  // 実行
  const result = await service.execute({ context: mockContext });

  // 検証
  expect(mockSessionManager.remove).toHaveBeenCalledWith(mockContext);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(AccountError);
    expect(result.error.code).toBe(AccountErrorCode.SESSION_REVOCATION_FAILED);
    expect(result.error.cause).toBe(providerError);
  }
});

