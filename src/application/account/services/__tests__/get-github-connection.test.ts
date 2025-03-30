import { expect, test, vi, beforeEach } from "vitest";
import { GetGitHubConnectionsService } from "../get-github-connection";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { GitHubConnection } from "@/domain/account/models/github-connection";

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

test("GitHub連携が存在する場合に連携情報が返されること", async () => {
  const userId = "test-user-id";
  const connection: GitHubConnection = {
    id: "connection-id",
    userId,
    accessToken: "github-access-token",
    refreshToken: "github-refresh-token",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    okAsync(connection),
  );

  const service = new GetGitHubConnectionsService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(connection);
  }
});

test("GitHub連携が存在しない場合にエラーが返されること", async () => {
  const userId = "non-existing-user-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "GitHub連携が見つかりません",
  );

  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    errAsync(repoError),
  );

  const service = new GetGitHubConnectionsService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
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

