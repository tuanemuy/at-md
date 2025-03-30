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
import { generateId } from "@/domain/types/id";
import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type { SessionManager } from "@/domain/account/adapters/session-manager";

// モック
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

const mockContext: RequestContext = {
  req: {} as IncomingMessage,
  res: {} as ServerResponse<IncomingMessage>,
};

beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なセッションの場合にセッションデータが返されること", async () => {
  const sessionData: SessionData = {
    did: "did:plc:" + generateId("DID"),
  };
  (mockSessionManager.get as any).mockReturnValue(okAsync(sessionData));
  (mockAuthProvider.validateSession as any).mockReturnValue(okAsync(sessionData));

  const service = new ValidateSessionService({
    deps: {
      authProvider: mockAuthProvider,
      sessionManager: mockSessionManager,
    },
  });

  const result = await service.execute({ context: mockContext });

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
  const errorId = generateId("Error");
  const providerError = new ExternalServiceError(
    "SessionManager",
    ExternalServiceErrorCode.REQUEST_FAILED,
    `Failed to get session (${errorId})`,
  );
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
  const sessionData: SessionData = {
    did: "did:plc:" + generateId("DID"),
  };
  const errorId = generateId("Error");
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.AUTHENTICATION_FAILED,
    `Failed to validate session (${errorId})`,
  );
  (mockSessionManager.get as any).mockReturnValue(okAsync(sessionData));
  (mockAuthProvider.validateSession as any).mockReturnValue(errAsync(providerError));

  const service = new ValidateSessionService({
    deps: {
      authProvider: mockAuthProvider,
      sessionManager: mockSessionManager,
    },
  });

  const result = await service.execute({ context: mockContext });

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

