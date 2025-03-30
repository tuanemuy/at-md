import { expect, test, vi, beforeEach } from "vitest";
import { DisconnectGitHubService } from "../disconnect-github";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";


const mockGitHubConnectionRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  deleteByUserId: vi.fn(),
  delete: vi.fn(),
};


beforeEach(() => {
  vi.resetAllMocks();
});

test("GitHub連携の解除が成功した場合にvoidが返されること", async () => {
  
  const userId = "test-user-id";

  mockGitHubConnectionRepository.deleteByUserId.mockReturnValue(
    okAsync(undefined),
  );

  const service = new DisconnectGitHubService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  
  const result = await service.execute({ userId });

  
  expect(mockGitHubConnectionRepository.deleteByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(result.isOk()).toBe(true);
});

test("GitHub連携の解除に失敗した場合にエラーが返されること", async () => {
  
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

  
  const result = await service.execute({ userId });

  
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

