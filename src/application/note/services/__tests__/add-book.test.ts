import type { GitHubConnection } from "@/domain/account/models";
import type { GitHubConnectionRepository } from "@/domain/account/repositories";
import type { Book, BookDetails, SyncStatus } from "@/domain/note/models";
import { SyncStatusCode } from "@/domain/note/models";
import type { BookRepository } from "@/domain/note/repositories";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
  RepositoryError,
  RepositoryErrorCode,
} from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { errAsync, okAsync } from "@/lib/result";
import { beforeEach, expect, test, vi } from "vitest";
import { AddBookService } from "../add-book";

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

const mockBookRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  list: vi.fn(),
  findByBookId: vi.fn(),
  findByUserIdAndRepo: vi.fn(),
  findByOwnerAndRepo: vi.fn(),
  deleteById: vi.fn(),
} as unknown as BookRepository;

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("ブックを追加できる場合", async () => {
  // テストの準備
  const userId = generateId("User");
  const bookId = generateId("Book");
  const owner = "owner1";
  const repo = "repo1";

  const connection: GitHubConnection = {
    id: generateId("Connection"),
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
    id: bookId,
    userId,
    owner,
    repo,
    details: {
      name: "Test Markdown",
      description:
        "This is a test markdown file with tags: #test-tag #another-tag",
    } as BookDetails,
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    } as SyncStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // GitHub連携情報が見つかる
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync(connection),
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubContentProvider.getContent as any).mockReturnValue(
    okAsync(markdownContent),
  );

  // ブックの作成に成功
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.create as any).mockReturnValue(okAsync(createdBook));

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
  const userId = generateId("User");
  const owner = "owner1";
  const repo = "repo1";
  const errorId = generateId("Error");

  const connection: GitHubConnection = {
    id: generateId("Connection"),
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
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync(connection),
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubContentProvider.getContent as any).mockReturnValue(
    okAsync(markdownContent),
  );

  // ブックの作成に失敗
  const repoError = new RepositoryError(
    RepositoryErrorCode.UNIQUE_VIOLATION,
    `Failed to create book (${errorId})`,
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.create as any).mockReturnValue(errAsync(repoError));

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
  const userId = generateId("User");
  const owner = "owner1";
  const repo = "repo1";
  const errorId = generateId("Error");

  // GitHub連携情報が見つからない
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `GitHub連携情報が見つかりません (${errorId})`,
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
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
  const userId = generateId("User");
  const owner = "owner1";
  const repo = "repo1";

  const connection: GitHubConnection = {
    id: generateId("Connection"),
    userId,
    accessToken: "github-access-token",
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // GitHub連携情報が見つかる
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync(connection),
  );

  // リポジトリが見つからない
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubContentProvider.getContent as any).mockReturnValue(errAsync());

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
  const userId = generateId("User");
  const owner = "owner1";
  const repo = "repo1";

  const connection: GitHubConnection = {
    id: generateId("Connection"),
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
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync(connection),
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubContentProvider.getContent as any).mockReturnValue(
    okAsync(markdownContent),
  );

  // ブックの作成に失敗
  const repoError = new RepositoryError(
    RepositoryErrorCode.SYSTEM_ERROR,
    "Failed to create book",
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.create as any).mockReturnValue(errAsync(repoError));

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
