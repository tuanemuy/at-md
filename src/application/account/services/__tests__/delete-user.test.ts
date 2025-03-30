import { expect, test, vi, beforeEach } from "vitest";
import { DeleteUserService } from "../delete-user";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";

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

test("ユーザー削除が成功した場合にvoidが返されること", async () => {
  const userId = "test-user-id";

  mockUserRepository.delete.mockReturnValue(okAsync(undefined));

  const service = new DeleteUserService({
    deps: {
      userRepository: mockUserRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
  expect(result.isOk()).toBe(true);
});

test("ユーザー削除に失敗した場合にエラーが返されること", async () => {
  const userId = "non-existing-user-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "ユーザーが見つかりません",
  );

  mockUserRepository.delete.mockReturnValue(errAsync(repoError));

  const service = new DeleteUserService({
    deps: {
      userRepository: mockUserRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

