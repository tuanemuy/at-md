import { expect, test, vi, beforeEach } from "vitest";
import { DisconnectGitHubService } from "../disconnect-github";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";

// モックの作成
const mockGitHubConnectionRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  deleteByUserId: vi.fn(),
  delete: vi.fn(),
};

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("GitHub連携の解除が成功した場合にvoidが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";

  mockGitHubConnectionRepository.deleteByUserId.mockReturnValue(
    okAsync(undefined),
  );

  const service = new DisconnectGitHubService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockGitHubConnectionRepository.deleteByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(result.isOk()).toBe(true);
});

test("GitHub連携の解除に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "GitHub連携が見つかりません",
  );

  mockGitHubConnectionRepository.deleteByUserId.mockReturnValue(
    errAsync(repoError),
  );

  const service = new DisconnectGitHubService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockGitHubConnectionRepository.deleteByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

