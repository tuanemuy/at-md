import type { Book, Note } from "@/domain/note/models";
import { NoteScope } from "@/domain/note/models/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
  ExternalServiceError,
  ExternalServiceErrorCode,
  RepositoryError,
  RepositoryErrorCode,
} from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { errAsync, okAsync } from "@/lib/result";
import { beforeEach, expect, test, vi } from "vitest";
import { SyncNotesService } from "../sync-notes";

// テスト用モック
const mockGitHubConnectionRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  deleteByUserId: vi.fn(),
  delete: vi.fn(),
};

const mockBookRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findByOwnerAndRepo: vi.fn(),
  delete: vi.fn(),
};

const mockNoteRepository = {
  createOrUpdate: vi.fn(),
  findById: vi.fn(),
  findByBookId: vi.fn(),
  findByTag: vi.fn(),
  search: vi.fn(),
  delete: vi.fn(),
  deleteByPath: vi.fn(),
};

const mockTagRepository = {
  findByNoteId: vi.fn(),
  findByBookId: vi.fn(),
  deleteUnused: vi.fn(),
};

const mockGithubContentProvider = {
  listRepositories: vi.fn(),
  getContent: vi.fn(),
  getContentByInstallation: vi.fn(),
  listPaths: vi.fn(),
  setupWebhook: vi.fn(),
};

// テスト用データ
const testBook: Book = {
  id: generateId("Book"),
  userId: generateId("User"),
  owner: "test-owner",
  repo: "test-repo",
  details: {
    name: "テストリポジトリ",
    description: "テスト用のリポジトリです",
  },
  syncStatus: {
    lastSyncedAt: null,
    status: SyncStatusCode.SYNCED,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("GitHubからの同期が成功した場合にノート数が返されること", async () => {
  const userId = generateId("User");
  const connectionId = generateId("Connection");

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync({
      id: connectionId,
      userId,
      accessToken: "test-token",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.findByOwnerAndRepo as any).mockReturnValue(
    okAsync(testBook),
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.update as any).mockReturnValue(okAsync(testBook));

  const existingNote: Note = {
    id: generateId("Note"),
    userId: testBook.userId,
    bookId: testBook.id,
    path: "path/to/existing-note.md",
    title: "既存ノート",
    body: "既存ノートの内容",
    scope: NoteScope.PUBLIC,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockNoteRepository.findByBookId as any).mockReturnValue(
    okAsync({
      items: [existingNote],
      count: 1,
    }),
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGithubContentProvider.listPaths as any).mockReturnValue(
    okAsync(["path/to/existing-note.md", "path/to/new-note.md"]),
  );

  const newNoteContent = `---
scope: public
tags: [テスト, マークダウン]
---
# 新しいノート
これは新しいノートの内容です。`;

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGithubContentProvider.getContent as any).mockReturnValue(
    okAsync(newNoteContent),
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockNoteRepository.createOrUpdate as any).mockReturnValue(
    okAsync({
      id: generateId("Note"),
      userId: testBook.userId,
      bookId: testBook.id,
      path: "path/to/new-note.md",
      title: "新しいノート",
      body: "これは新しいノートの内容です。",
      scope: NoteScope.PUBLIC,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockTagRepository.deleteUnused as any).mockReturnValue(okAsync(undefined));

  const service = new SyncNotesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
      tagRepository: mockTagRepository,
      githubContentProvider: mockGithubContentProvider,
    },
  });

  const result = await service.execute({
    userId,
    owner: "test-owner",
    repo: "test-repo",
  });

  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockBookRepository.findByOwnerAndRepo).toHaveBeenCalledWith(
    "test-owner",
    "test-repo",
  );
  expect(mockGithubContentProvider.listPaths).toHaveBeenCalledWith(
    "test-token",
    "test-owner",
    "test-repo",
  );
  expect(mockGithubContentProvider.getContent).toHaveBeenCalledWith(
    "test-token",
    "test-owner",
    "test-repo",
    "path/to/new-note.md",
  );

  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toBe(2);
  }
});

test("GitHubとの連携情報が見つからない場合にエラーが返されること", async () => {
  const userId = generateId("User");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `GitHub連携情報が見つかりません (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    errAsync(repoError),
  );

  const service = new SyncNotesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
      tagRepository: mockTagRepository,
      githubContentProvider: mockGithubContentProvider,
    },
  });

  const result = await service.execute({
    userId,
    owner: "test-owner",
    repo: "test-repo",
  });

  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

test("ブックが見つからない場合にエラーが返されること", async () => {
  const userId = generateId("User");
  const connectionId = generateId("Connection");
  const errorId = generateId("Error");

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync({
      id: connectionId,
      userId,
      accessToken: "test-token",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );

  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `ブックが見つかりません (${errorId})`,
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.findByOwnerAndRepo as any).mockReturnValue(
    errAsync(repoError),
  );

  const service = new SyncNotesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
      tagRepository: mockTagRepository,
      githubContentProvider: mockGithubContentProvider,
    },
  });

  const result = await service.execute({
    userId,
    owner: "test-owner",
    repo: "test-repo",
  });

  expect(mockBookRepository.findByOwnerAndRepo).toHaveBeenCalledWith(
    "test-owner",
    "test-repo",
  );
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

test("パスの一覧取得に失敗した場合にエラーが返されること", async () => {
  const userId = generateId("User");
  const connectionId = generateId("Connection");
  const errorId = generateId("Error");

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync({
      id: connectionId,
      userId,
      accessToken: "test-token",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.findByOwnerAndRepo as any).mockReturnValue(
    okAsync(testBook),
  );

  const contentError = new ExternalServiceError(
    "GitHubContent",
    ExternalServiceErrorCode.REQUEST_FAILED,
    `Failed to list paths (${errorId})`,
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGithubContentProvider.listPaths as any).mockReturnValue(
    errAsync(contentError),
  );

  const service = new SyncNotesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
      tagRepository: mockTagRepository,
      githubContentProvider: mockGithubContentProvider,
    },
  });

  const result = await service.execute({
    userId,
    owner: "test-owner",
    repo: "test-repo",
  });

  expect(mockGithubContentProvider.listPaths).toHaveBeenCalledWith(
    "test-token",
    "test-owner",
    "test-repo",
  );
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(contentError);
  }
});

test("ファイル内容の取得に失敗した場合はそのファイルをスキップすること", async () => {
  const userId = generateId("User");
  const connectionId = generateId("Connection");

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync({
      id: connectionId,
      userId,
      accessToken: "test-token",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.findByOwnerAndRepo as any).mockReturnValue(
    okAsync(testBook),
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.update as any).mockReturnValue(okAsync(testBook));

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGithubContentProvider.listPaths as any).mockReturnValue(
    okAsync(["path/to/new-note.md"]),
  );

  const contentError = new ExternalServiceError(
    "GitHubContent",
    ExternalServiceErrorCode.REQUEST_FAILED,
    "Failed to get content",
  );
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGithubContentProvider.getContent as any).mockReturnValue(
    errAsync(contentError),
  );

  const service = new SyncNotesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
      tagRepository: mockTagRepository,
      githubContentProvider: mockGithubContentProvider,
    },
  });

  const result = await service.execute({
    userId,
    owner: "test-owner",
    repo: "test-repo",
  });

  expect(mockGithubContentProvider.getContent).toHaveBeenCalledWith(
    "test-token",
    "test-owner",
    "test-repo",
    "path/to/new-note.md",
  );
  expect(mockNoteRepository.createOrUpdate).not.toHaveBeenCalled();

  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toBe(0);
  }
});
