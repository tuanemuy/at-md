import { expect, test, vi, beforeEach } from "vitest";
import { UpdateProfileService } from "../update-profile";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { User } from "@/domain/account/models/user";
import type { Profile } from "@/domain/account/models";

// モックの作成
const mockUserRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByDid: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("プロフィール更新が成功した場合に更新後のユーザー情報が返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const did = "test-did";
  const updatedProfile: Profile = {
    displayName: "Updated User",
    description: "Updated description",
    avatarUrl: "https://example.com/avatar-updated.jpg",
    bannerUrl: "https://example.com/banner-updated.jpg",
  };

  const updatedUser: User = {
    id: userId,
    did,
    profile: updatedProfile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockUserRepository.update.mockReturnValue(okAsync(updatedUser));

  const service = new UpdateProfileService({
    deps: {
      userRepository: mockUserRepository,
    },
  });

  // 実行
  const result = await service.execute({
    userId,
    did,
    profile: updatedProfile,
  });

  // 検証
  expect(mockUserRepository.update).toHaveBeenCalledWith({
    id: userId,
    userId,
    did,
    profile: updatedProfile,
  });
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(updatedUser);
  }
});

test("プロフィール更新に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const did = "test-did";
  const updatedProfile: Profile = {
    displayName: "Updated User",
    description: "Updated description",
    avatarUrl: "https://example.com/avatar-updated.jpg",
    bannerUrl: "https://example.com/banner-updated.jpg",
  };

  const repoError = new RepositoryError(
    RepositoryErrorCode.DATA_ERROR,
    "データ更新エラー",
  );

  mockUserRepository.update.mockReturnValue(errAsync(repoError));

  const service = new UpdateProfileService({
    deps: {
      userRepository: mockUserRepository,
    },
  });

  // 実行
  const result = await service.execute({
    userId,
    did,
    profile: updatedProfile,
  });

  // 検証
  expect(mockUserRepository.update).toHaveBeenCalledWith({
    id: userId,
    userId,
    did,
    profile: updatedProfile,
  });
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

