import { expect, test, vi, beforeEach } from "vitest";
import { HandleBlueskyAuthCallbackService } from "../handle-bluesky-auth-callback";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { Profile } from "@/domain/account/models";
import type { User } from "@/domain/account/models/user";
import { generateId } from "@/domain/types/id";
import type { BlueskyAuthProvider } from "@/domain/account/adapters/bluesky-auth-provider";
import type { UserRepository } from "@/domain/account/repositories";

// モック
const mockAuthProvider = {
  authorize: vi.fn(),
  callback: vi.fn(),
  getUserProfile: vi.fn(),
  validateSession: vi.fn(),
} as unknown as BlueskyAuthProvider;

const mockUserRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByDid: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as unknown as UserRepository;

// URLSearchParamsのモック
const mockParams = new URLSearchParams();
mockParams.append("code", "test-code");
mockParams.append("state", "test-state");

beforeEach(() => {
  vi.resetAllMocks();
});

test("既存ユーザーの場合にセッションが返されること", async () => {
  const did = "did:plc:" + generateId("DID");
  const profile: Profile = {
    displayName: "New User",
    description: "Test description",
    avatarUrl: "https://example.com/avatar.jpg",
    bannerUrl: "https://example.com/banner.jpg",
  };
  const existingUser: User = {
    id: generateId("User"),
    did,
    profile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  (mockAuthProvider.callback as any).mockReturnValue(okAsync(did));
  (mockUserRepository.findByDid as any).mockReturnValue(okAsync(existingUser));
  (mockAuthProvider.getUserProfile as any).mockReturnValue(okAsync(profile));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository: mockUserRepository,
    },
  });

  const result = await service.execute({ params: mockParams });

  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(did);
  expect(mockUserRepository.create).not.toHaveBeenCalled();
  expect(result.isOk()).toBe(true);
});

test("新規ユーザーの場合にユーザーが作成されること", async () => {
  const did = "did:plc:" + generateId("DID");
  const profile: Profile = {
    displayName: "New User",
    description: "Test description",
    avatarUrl: "https://example.com/avatar.jpg",
    bannerUrl: "https://example.com/banner.jpg",
  };
  const newUser: User = {
    id: generateId("User"),
    did,
    profile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  (mockAuthProvider.callback as any).mockReturnValue(okAsync(did));
  (mockUserRepository.findByDid as any).mockReturnValue(errAsync());
  (mockAuthProvider.getUserProfile as any).mockReturnValue(okAsync(profile));
  (mockUserRepository.create as any).mockReturnValue(okAsync(newUser));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository: mockUserRepository,
    },
  });

  const result = await service.execute({ params: mockParams });

  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(did);
  expect(mockAuthProvider.getUserProfile).toHaveBeenCalledWith(did);
  expect(mockUserRepository.create).toHaveBeenCalledWith({
    did,
    profile: {
      displayName: profile.displayName,
      description: profile.description,
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
    },
  });
  expect(result.isOk()).toBe(true);
});

test("コールバック処理に失敗した場合にエラーが返されること", async () => {
  const errorId = generateId("Error");
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.AUTHENTICATION_FAILED,
    `Failed to handle callback (${errorId})`,
  );
  (mockAuthProvider.callback as any).mockReturnValue(errAsync(providerError));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository: mockUserRepository,
    },
  });

  const result = await service.execute({ params: mockParams });

  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(mockUserRepository.findByDid).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});

test("ユーザー情報の確認に失敗した場合にエラーが返されること", async () => {
  const did = "did:plc:" + generateId("DID");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.UNKNOWN_ERROR,
    `Database error (${errorId})`,
  );
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.REQUEST_FAILED,
    `Failed to get user profile (${errorId})`,
  );
  (mockAuthProvider.callback as any).mockReturnValue(okAsync(did));
  (mockUserRepository.findByDid as any).mockReturnValue(errAsync(repoError));
  (mockAuthProvider.getUserProfile as any).mockReturnValue(errAsync(providerError));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository: mockUserRepository,
    },
  });

  const result = await service.execute({ params: mockParams });

  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(did);
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

