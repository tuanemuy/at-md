import { expect, test, vi } from "vitest";
import { StartBlueskyAuthService } from "../start-bluesky-auth";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";

const mockAuthProvider = {
  authorize: vi.fn(),
  callback: vi.fn(),
  getUserProfile: vi.fn(),
  validateSession: vi.fn(),
};

test("有効なハンドルの場合に認証URLが生成されること", async () => {
  const handle = "valid-handle";
  const expectedUrl = new URL("https://example.com/auth");
  mockAuthProvider.authorize.mockReturnValue(okAsync(expectedUrl));

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

