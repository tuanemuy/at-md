import { expect, test, vi, beforeEach } from "vitest";
import { GetUserByIdService } from "../get-user-by-id";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { User } from "@/domain/account/models/user";

const mockUserRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  findByDid: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

test("存在するユーザーIDの場合にユーザー情報が返されること", async () => {
  const userId = "existing-user-id";
  const expectedUser: User = {
    id: userId,
    did: "test-did",
    profile: {
      displayName: "Test User",
      description: null,
      avatarUrl: null,
      bannerUrl: null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockUserRepository.findById.mockReturnValue(okAsync(expectedUser));

  const service = new GetUserByIdService({
    deps: {
      userRepository: mockUserRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(expectedUser);
  }
});

test("存在しないユーザーIDの場合にエラーが返されること", async () => {
  const userId = "non-existing-user-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "ユーザーが見つかりません",
  );

  mockUserRepository.findById.mockReturnValue(errAsync(repoError));

  const service = new GetUserByIdService({
    deps: {
      userRepository: mockUserRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

