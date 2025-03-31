import type { IncomingMessage, ServerResponse } from "node:http";
import type { SessionManager } from "@/domain/account/adapters/session-manager";
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
import { errAsync, okAsync } from "@/lib/result";
import type { ResultAsync } from "@/lib/result";
import { beforeEach, expect, test, vi } from "vitest";
import { LogoutService } from "../logout";

// セッションマネージャーのモック
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

beforeEach(() => {
  vi.resetAllMocks();
});

test("ログアウト処理が成功した場合にvoidが返されること", async () => {
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockSessionManager.remove as any).mockReturnValue(okAsync(undefined));

  const service = new LogoutService({
    deps: {
      sessionManager: mockSessionManager,
    },
  });

  const result = await service.execute({ context: mockContext });

  expect(mockSessionManager.remove).toHaveBeenCalledWith(mockContext);
  expect(result.isOk()).toBe(true);
});

test("ログアウト処理が失敗した場合にエラーが返されること", async () => {
  const errorId = generateId("Error");
  const providerError = new ExternalServiceError(
    "SessionManager",
    ExternalServiceErrorCode.REQUEST_FAILED,
    `Failed to remove session (${errorId})`,
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockSessionManager.remove as any).mockReturnValue(errAsync(providerError));

  const service = new LogoutService({
    deps: {
      sessionManager: mockSessionManager,
    },
  });

  const result = await service.execute({ context: mockContext });

  expect(mockSessionManager.remove).toHaveBeenCalledWith(mockContext);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});
