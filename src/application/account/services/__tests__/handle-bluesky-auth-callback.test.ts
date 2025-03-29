import { expect, test, vi, beforeEach } from "vitest";
import { HandleBlueskyAuthCallbackService } from "../handle-bluesky-auth-callback";
import { okAsync, errAsync } from "@/lib/result";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { Profile } from "@/domain/account/models";
import type { User } from "@/domain/account/models/user";

// モックの作成
const mockAuthProvider = {
  authorize: vi.fn(),
  callback: vi.fn(),
  getUserProfile: vi.fn(),
  validateSession: vi.fn(),
};

const mockUserRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByDid: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// URLSearchParamsのモック
const mockParams = new URLSearchParams();
mockParams.append("code", "test-code");
mockParams.append("state", "test-state");

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("既存ユーザーの場合にセッションが返されること", async () => {
  // テストの準備
  const did = "test-did";
  const profile: Profile = {
    displayName: "New User",
    description: "Test description",
    avatarUrl: "https://example.com/avatar.jpg",
    bannerUrl: "https://example.com/banner.jpg",
  };
  const existingUser: User = {
    id: "user-id",
    did,
    profile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockAuthProvider.callback.mockReturnValue(okAsync(did));
  mockUserRepository.findByDid.mockReturnValue(okAsync(existingUser));
  mockAuthProvider.getUserProfile.mockReturnValue(okAsync(profile));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository: mockUserRepository,
    },
  });

  // 実行
  const result = await service.execute({ params: mockParams });

  // 検証
  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(did);
  expect(mockUserRepository.create).not.toHaveBeenCalled();
  expect(result.isOk()).toBe(true);
});

test("新規ユーザーの場合にユーザーが作成されること", async () => {
  // テストの準備
  const did = "test-did";
  const profile: Profile = {
    displayName: "New User",
    description: "Test description",
    avatarUrl: "https://example.com/avatar.jpg",
    bannerUrl: "https://example.com/banner.jpg",
  };
  const newUser: User = {
    id: "new-user-id",
    did,
    profile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockAuthProvider.callback.mockReturnValue(okAsync(did));
  mockUserRepository.findByDid.mockReturnValue(errAsync());
  mockAuthProvider.getUserProfile.mockReturnValue(okAsync(profile));
  mockUserRepository.create.mockReturnValue(okAsync(newUser));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository: mockUserRepository,
    },
  });

  // 実行
  const result = await service.execute({ params: mockParams });

  // 検証
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
  // テストの準備
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.AUTHENTICATION_FAILED,
    "Failed to handle callback",
  );
  mockAuthProvider.callback.mockReturnValue(errAsync(providerError));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository: mockUserRepository,
    },
  });

  // 実行
  const result = await service.execute({ params: mockParams });

  // 検証
  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(mockUserRepository.findByDid).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(AccountError);
    expect(result.error.code).toBe(AccountErrorCode.CALLBACK_FAILED);
    expect(result.error.cause).toBe(providerError);
  }
});

test("ユーザー情報の確認に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const did = "test-did";
  const repoError = new RepositoryError(
    RepositoryErrorCode.UNKNOWN_ERROR,
    "Database error",
  );
  const providerError = new ExternalServiceError(
    "BlueskyAuth",
    ExternalServiceErrorCode.REQUEST_FAILED,
    "Failed to get user profile",
  );
  mockAuthProvider.callback.mockReturnValue(okAsync(did));
  mockUserRepository.findByDid.mockReturnValue(errAsync(repoError));
  mockAuthProvider.getUserProfile.mockReturnValue(errAsync(providerError));

  const service = new HandleBlueskyAuthCallbackService({
    deps: {
      authProvider: mockAuthProvider,
      userRepository: mockUserRepository,
    },
  });

  // 実行
  const result = await service.execute({ params: mockParams });

  // 検証
  expect(mockAuthProvider.callback).toHaveBeenCalledWith(mockParams);
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(did);
  expect(mockAuthProvider.getUserProfile).toHaveBeenCalledWith(did);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(AccountError);
    expect(result.error.code).toBe(AccountErrorCode.CALLBACK_FAILED);
    expect(result.error.cause).toBe(providerError);
  }
});

