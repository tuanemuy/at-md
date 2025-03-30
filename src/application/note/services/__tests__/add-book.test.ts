import { expect, test, vi, beforeEach } from "vitest";
import { AddBookService } from "../add-book";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
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

  const markdownContent = `---
scope: public
---

# Test Markdown

This is a test markdown file with tags: #test-tag #another-tag`;

  const createdBook: Book = {
    id: "book-id",
    userId,
    owner,
    repo,
    details: {
      name: "Test Markdown",
      description:
        "This is a test markdown file with tags: #test-tag #another-tag",
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // GitHub連携情報が見つかる
  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    okAsync(connection),
  );

  mockGitHubContentProvider.getContent.mockReturnValue(
    okAsync(markdownContent),
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
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.getContent).toHaveBeenCalledWith(
    connection.accessToken,
    owner,
    repo,
    "README.md",
  );
  expect(mockBookRepository.create).toHaveBeenCalledWith({
    userId,
    owner,
    repo,
    details: {
      name: "Test Markdown",
      description:
        "This is a test markdown file with tags: #test-tag #another-tag",
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

  const connection: GitHubConnection = {
    id: "connection-id",
    userId,
    accessToken: "github-access-token",
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const markdownContent = `---
scope: public
---

# Test Markdown

This is a test markdown file with tags: #test-tag #another-tag`;

  const service = new AddBookService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
      bookRepository: mockBookRepository,
    },
  });

  // GitHub連携情報が見つかる
  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    okAsync(connection),
  );

  mockGitHubContentProvider.getContent.mockReturnValue(
    okAsync(markdownContent),
  );

  // ブックの作成に失敗
  const repoError = new RepositoryError(
    RepositoryErrorCode.UNIQUE_VIOLATION,
    "Failed to create book",
  );
  mockBookRepository.create.mockReturnValue(errAsync(repoError));

  // 実行
  const result = await service.execute({ userId, owner, repo });

  // 検証
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.getContent).toHaveBeenCalledWith(
    connection.accessToken,
    owner,
    repo,
    "README.md",
  );
  expect(mockBookRepository.create).toHaveBeenCalledWith({
    userId,
    owner,
    repo,
    details: {
      name: "Test Markdown",
      description:
        "This is a test markdown file with tags: #test-tag #another-tag",
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
  });

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
  }
});

test("GitHub連携情報が見つからない場合にエラーが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const owner = "owner1";
  const repo = "repo1";

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
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.getContent).not.toHaveBeenCalled();
  expect(mockBookRepository.create).not.toHaveBeenCalled();

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
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

  // GitHub連携情報が見つかる
  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    okAsync(connection),
  );

  // リポジトリが見つからない
  mockGitHubContentProvider.getContent.mockReturnValue(errAsync());

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
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.getContent).toHaveBeenCalledWith(
    connection.accessToken,
    owner,
    repo,
    "README.md",
  );
  expect(mockBookRepository.create).not.toHaveBeenCalled();

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
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

  const markdownContent = `---
scope: public
---

# Test Markdown

This is a test markdown file with tags: #test-tag #another-tag`;

  // GitHub連携情報が見つかる
  mockGitHubConnectionRepository.findByUserId.mockReturnValue(
    okAsync(connection),
  );

  mockGitHubContentProvider.getContent.mockReturnValue(
    okAsync(markdownContent),
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
  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockGitHubContentProvider.getContent).toHaveBeenCalledWith(
    connection.accessToken,
    owner,
    repo,
    "README.md",
  );
  expect(mockBookRepository.create).toHaveBeenCalledWith({
    userId,
    owner,
    repo,
    details: {
      name: "Test Markdown",
      description:
        "This is a test markdown file with tags: #test-tag #another-tag",
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
  });

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

