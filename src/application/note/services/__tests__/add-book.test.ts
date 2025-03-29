import { expect, test, vi, beforeEach } from "vitest";
import { AddBookService } from "../add-book";
import { okAsync, errAsync } from "@/lib/result";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { Book } from "@/domain/note/models";
import type { GitHubRepository } from "@/domain/note/dtos";
import type { GitHubConnection } from "@/domain/account/models";
import { SyncStatusCode } from "@/domain/note/models/sync-status";

// モックの作成
const mockGitHubConnectionRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  deleteByUserId: vi.fn(),
  delete: vi.fn(),
};

const mockGitHubContentProvider = {
  listRepositories: vi.fn(),
  getContent: vi.fn(),
  getContentByInstallation: vi.fn(),
  listPaths: vi.fn(),
  setupWebhook: vi.fn(),
};

const mockBookRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findByOwnerAndRepo: vi.fn(),
  delete: vi.fn(),
};

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("ブックが正常に追加された場合にブック情報が返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const owner = "owner1";
  const repo = "repo1";

  const connection: GitHubConnection = {
    id: "connection-id",
    userId,
    accessToken: "github-access-token",
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const repositories: GitHubRepository[] = [
    {
      owner,
      name: repo,
      fullName: `${owner}/${repo}`,
    },
  ];

  const createdBook: Book = {
    id: "book-id",
    userId,
    owner,
    repo,
    details: {
      name: repo,
      description: `${owner}/${repo}`,
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 既存のブックが見つからない
  mockBookRepository.findByOwnerAndRepo.mockReturnValue(
    errAsync(
      new RepositoryError(RepositoryErrorCode.NOT_FOUND, "Book not found"),
    ),
  );

  // GitHub連携情報が見つかる
  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    okAsync(connection),
  );

  // リポジトリ一覧を取得できる
  mockGitHubContentProvider.listRepositories.mockReturnValue(
    okAsync(repositories),
  );

  // ブックの作成に成功
  mockBookRepository.create.mockReturnValue(okAsync(createdBook));

  const service = new AddBookService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, owner, repo });

  // 検証
  expect(mockBookRepository.findByOwnerAndRepo).toHaveBeenCalledWith(
    owner,
    repo,
  );
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.listRepositories).toHaveBeenCalledWith(
    connection.accessToken,
  );
  expect(mockBookRepository.create).toHaveBeenCalledWith({
    userId,
    owner,
    repo,
    details: {
      name: repo,
      description: `${owner}/${repo}`,
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
  });

  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(createdBook);
  }
});

test("同じリポジトリが既に登録されている場合にエラーが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const owner = "owner1";
  const repo = "repo1";

  const existingBook: Book = {
    id: "existing-book-id",
    userId,
    owner,
    repo,
    details: {
      name: repo,
      description: `${owner}/${repo}`,
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 既存のブックが見つかる
  mockBookRepository.findByOwnerAndRepo.mockReturnValue(okAsync(existingBook));

  const service = new AddBookService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, owner, repo });

  // 検証
  expect(mockBookRepository.findByOwnerAndRepo).toHaveBeenCalledWith(
    owner,
    repo,
  );
  expect(mockGitHubConnectionRepository.findByUserId).not.toHaveBeenCalled();
  expect(mockGitHubContentProvider.listRepositories).not.toHaveBeenCalled();
  expect(mockBookRepository.create).not.toHaveBeenCalled();

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.BOOK_ALREADY_EXISTS);
  }
});

test("GitHub連携情報が見つからない場合にエラーが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const owner = "owner1";
  const repo = "repo1";

  // 既存のブックが見つからない
  mockBookRepository.findByOwnerAndRepo.mockReturnValue(
    errAsync(
      new RepositoryError(RepositoryErrorCode.NOT_FOUND, "Book not found"),
    ),
  );

  // GitHub連携情報が見つからない
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "GitHub連携情報が見つかりません",
  );
  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    errAsync(repoError),
  );

  const service = new AddBookService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, owner, repo });

  // 検証
  expect(mockBookRepository.findByOwnerAndRepo).toHaveBeenCalledWith(
    owner,
    repo,
  );
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.listRepositories).not.toHaveBeenCalled();
  expect(mockBookRepository.create).not.toHaveBeenCalled();

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.CONNECTION_NOT_FOUND);
    expect(result.error.cause).toBe(repoError);
  }
});

test("リポジトリ一覧の取得に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const owner = "owner1";
  const repo = "repo1";

  const connection: GitHubConnection = {
    id: "connection-id",
    userId,
    accessToken: "github-access-token",
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 既存のブックが見つからない
  mockBookRepository.findByOwnerAndRepo.mockReturnValue(
    errAsync(
      new RepositoryError(RepositoryErrorCode.NOT_FOUND, "Book not found"),
    ),
  );

  // GitHub連携情報が見つかる
  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    okAsync(connection),
  );

  // リポジトリ一覧の取得に失敗
  const providerError = new ExternalServiceError(
    "GitHubContent",
    ExternalServiceErrorCode.REQUEST_FAILED,
    "Failed to list repositories",
  );
  mockGitHubContentProvider.listRepositories.mockReturnValue(
    errAsync(providerError),
  );

  const service = new AddBookService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, owner, repo });

  // 検証
  expect(mockBookRepository.findByOwnerAndRepo).toHaveBeenCalledWith(
    owner,
    repo,
  );
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.listRepositories).toHaveBeenCalledWith(
    connection.accessToken,
  );
  expect(mockBookRepository.create).not.toHaveBeenCalled();

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.GITHUB_CONTENT_FETCH_FAILED);
    expect(result.error.cause).toBe(providerError);
  }
});

test("指定されたリポジトリが存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const owner = "owner1";
  const repo = "repo1";

  const connection: GitHubConnection = {
    id: "connection-id",
    userId,
    accessToken: "github-access-token",
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 既存のブックが見つからない
  mockBookRepository.findByOwnerAndRepo.mockReturnValue(
    errAsync(
      new RepositoryError(RepositoryErrorCode.NOT_FOUND, "Book not found"),
    ),
  );

  // GitHub連携情報が見つかる
  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    okAsync(connection),
  );

  // リポジトリ一覧を取得できるが、指定したリポジトリは含まれていない
  mockGitHubContentProvider.listRepositories.mockReturnValue(
    okAsync([
      {
        owner: "other-owner",
        name: "other-repo",
        fullName: "other-owner/other-repo",
      },
    ]),
  );

  const service = new AddBookService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, owner, repo });

  // 検証
  expect(mockBookRepository.findByOwnerAndRepo).toHaveBeenCalledWith(
    owner,
    repo,
  );
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.listRepositories).toHaveBeenCalledWith(
    connection.accessToken,
  );
  expect(mockBookRepository.create).not.toHaveBeenCalled();

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.INVALID_REPOSITORY);
  }
});

test("ブックの作成に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const owner = "owner1";
  const repo = "repo1";

  const connection: GitHubConnection = {
    id: "connection-id",
    userId,
    accessToken: "github-access-token",
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const repositories: GitHubRepository[] = [
    {
      owner,
      name: repo,
      fullName: `${owner}/${repo}`,
    },
  ];

  // 既存のブックが見つからない
  mockBookRepository.findByOwnerAndRepo.mockReturnValue(
    errAsync(
      new RepositoryError(RepositoryErrorCode.NOT_FOUND, "Book not found"),
    ),
  );

  // GitHub連携情報が見つかる
  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    okAsync(connection),
  );

  // リポジトリ一覧を取得できる
  mockGitHubContentProvider.listRepositories.mockReturnValue(
    okAsync(repositories),
  );

  // ブックの作成に失敗
  const repoError = new RepositoryError(
    RepositoryErrorCode.DATA_ERROR,
    "Failed to create book",
  );
  mockBookRepository.create.mockReturnValue(errAsync(repoError));

  const service = new AddBookService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, owner, repo });

  // 検証
  expect(mockBookRepository.findByOwnerAndRepo).toHaveBeenCalledWith(
    owner,
    repo,
  );
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.listRepositories).toHaveBeenCalledWith(
    connection.accessToken,
  );
  expect(mockBookRepository.create).toHaveBeenCalledWith({
    userId,
    owner,
    repo,
    details: {
      name: repo,
      description: `${owner}/${repo}`,
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
  });

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.INVALID_REPOSITORY);
    expect(result.error.cause).toBe(repoError);
  }
});

