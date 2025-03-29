import { expect, test, vi } from "vitest";
import { StartBlueskyAuthService } from "../start-bluesky-auth";
import { okAsync, errAsync } from "@/lib/result";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";

// モックの作成
const mockAuthProvider = {
  authorize: vi.fn(),
  callback: vi.fn(),
  getUserProfile: vi.fn(),
  validateSession: vi.fn(),
};

test("有効なハンドルの場合に認証URLが生成されること", async () => {
  // テスト準備
  const handle = "valid-handle";
  const expectedUrl = new URL("https://example.com/auth");
  mockAuthProvider.authorize.mockReturnValue(okAsync(expectedUrl));

  const service = new StartBlueskyAuthService({
    deps: {
      authProvider: mockAuthProvider,
    },
  });

  // 実行
  const result = await service.execute({ handle });

  // 検証
  expect(mockAuthProvider.authorize).toHaveBeenCalledWith(handle);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(expectedUrl);
  }
});

test("無効なハンドルの場合にエラーが返されること", async () => {
  // テスト準備
  const handle = "invalid-handle";
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.AUTHENTICATION_FAILED,
    "Invalid handle",
  );
  mockAuthProvider.authorize.mockReturnValue(errAsync(providerError));

  const service = new StartBlueskyAuthService({
    deps: {
      authProvider: mockAuthProvider,
    },
  });

  // 実行
  const result = await service.execute({ handle });

  // 検証
  expect(mockAuthProvider.authorize).toHaveBeenCalledWith(handle);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(AccountError);
    expect(result.error.code).toBe(AccountErrorCode.AUTHORIZATION_FAILED);
    expect(result.error.cause).toBe(providerError);
  }
});

