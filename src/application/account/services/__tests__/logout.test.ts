import { expect, test, vi, beforeEach } from "vitest";
import { LogoutService } from "../logout";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { RequestContext } from "@/domain/types/http";
import type { IncomingMessage, ServerResponse } from "node:http";

const mockSessionManager = {
  set: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
};

const mockContext: RequestContext = {
  req: {} as IncomingMessage,
  res: {} as ServerResponse<IncomingMessage>,
};

beforeEach(() => {
  vi.resetAllMocks();
});

test("ログアウト処理が成功した場合にvoidが返されること", async () => {
  mockSessionManager.remove.mockReturnValue(okAsync(undefined));

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

