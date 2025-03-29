import { expect, test, vi, beforeEach } from "vitest";
import { DeleteUserService } from "../delete-user";
import { okAsync, errAsync } from "@/lib/result";
import { AccountError, AccountErrorCode } from "@/domain/account/models/errors";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";

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

test("ユーザー削除が成功した場合にvoidが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";

  mockUserRepository.delete.mockReturnValue(okAsync(undefined));

  const service = new DeleteUserService({
    deps: {
      userRepository: mockUserRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
  expect(result.isOk()).toBe(true);
});

test("ユーザー削除に失敗した場合にエラーが返されること", async () => {
  // テストの準備
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

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(AccountError);
    expect(result.error.code).toBe(AccountErrorCode.USER_NOT_FOUND);
    expect(result.error.cause).toBe(repoError);
  }
});

