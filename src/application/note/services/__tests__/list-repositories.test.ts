import { expect, test, vi, beforeEach } from "vitest";
import { ListRepositoriesService } from "../list-repositories";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
  RepositoryError,
  RepositoryErrorCode,
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { GitHubRepository } from "@/domain/note/dtos";
import type { GitHubConnection } from "@/domain/account/models";
import { generateId } from "@/domain/types/id";
import type { GitHubConnectionRepository } from "@/domain/account/repositories";

// モックの作成
const mockGitHubConnectionRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  deleteByUserId: vi.fn(),
  delete: vi.fn(),
} as unknown as GitHubConnectionRepository;

const mockGitHubContentProvider = {
  listRepositories: vi.fn(),
  getContent: vi.fn(),
  getContentByInstallation: vi.fn(),
  listPaths: vi.fn(),
  setupWebhook: vi.fn(),
};

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("GitHub連携が存在する場合にリポジトリ一覧が返されること", async () => {
  // テストの準備
  const userId = generateId("User");
  const connection: GitHubConnection = {
    id: generateId("Connection"),
    userId,
    accessToken: "github-access-token",
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const repositories: GitHubRepository[] = [
    {
      owner: "owner1",
      name: "repo1",
      fullName: "owner1/repo1",
    },
    {
      owner: "owner2",
      name: "repo2",
      fullName: "owner2/repo2",
    },
  ];

  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync(connection),
  );
  (mockGitHubContentProvider.listRepositories as any).mockReturnValue(
    okAsync(repositories),
  );

  const service = new ListRepositoriesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.listRepositories).toHaveBeenCalledWith(
    connection.accessToken,
  );
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(repositories);
    expect(result.value.length).toBe(2);
  }
});

test("GitHub連携が存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const userId = generateId("User");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `GitHub連携情報が見つかりません (${errorId})`,
  );

  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    errAsync(repoError),
  );

  const service = new ListRepositoriesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.listRepositories).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR
    );
    expect(result.error.cause).toBe(repoError);
  }
});

test("リポジトリ一覧の取得に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const userId = generateId("User");
  const connection: GitHubConnection = {
    id: generateId("Connection"),
    userId,
    accessToken: "github-access-token",
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const errorId = generateId("Error");

  const providerError = new ExternalServiceError(
    "GitHubContent",
    ExternalServiceErrorCode.REQUEST_FAILED,
    `Failed to list repositories (${errorId})`,
  );

  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync(connection),
  );
  (mockGitHubContentProvider.listRepositories as any).mockReturnValue(
    errAsync(providerError),
  );

  const service = new ListRepositoriesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.listRepositories).toHaveBeenCalledWith(
    connection.accessToken,
  );
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR
    );
    expect(result.error.cause).toBe(providerError);
  }
});

