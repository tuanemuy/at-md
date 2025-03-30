import { expect, test, vi, beforeEach } from "vitest";
import { SearchNotesService } from "../search-notes";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { Book, Note } from "@/domain/note/models";
import { NoteScope } from "@/domain/note/models/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";

// モックの作成
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

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なブックと検索クエリが指定された場合にノート一覧が返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
  const userId = "test-user-id";
  const query = "テスト";

  const book: Book = {
    id: bookId,
    userId,
    owner: "owner1",
    repo: "repo1",
    details: {
      name: "repo1",
      description: "owner1/repo1",
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const notes: Note[] = [
    {
      id: "note-id-1",
      userId,
      bookId,
      path: "/path/to/note1.md",
      title: "テストノート1",
      body: "テストノート1の本文",
      scope: NoteScope.PUBLIC,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "note-id-2",
      userId,
      bookId,
      path: "/path/to/note2.md",
      title: "テストノート2",
      body: "テストノート2の本文",
      scope: NoteScope.PUBLIC,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  mockNoteRepository.search.mockReturnValue(
    okAsync({
      items: notes,
      count: notes.length,
    }),
  );

  const service = new SearchNotesService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  // 実行
  const result = await service.execute({
    bookId,
    query,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  // 検証
  expect(mockNoteRepository.search).toHaveBeenCalledWith(
    bookId,
    query,
    expect.objectContaining({
      page: 1,
      limit: 10,
      order: "desc",
      orderBy: "updatedAt",
    }),
  );
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.items).toEqual(notes);
    expect(result.value.count).toBe(2);
  }
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "non-existing-book-id";
  const query = "テスト";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "ブックが見つかりません",
  );

  mockNoteRepository.search.mockReturnValue(errAsync(repoError));

  const service = new SearchNotesService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  // 実行
  const result = await service.execute({
    bookId,
    query,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  // 検証
  expect(mockNoteRepository.search).toHaveBeenCalledWith(
    bookId,
    query,
    expect.objectContaining({
      page: 1,
      limit: 10,
      order: "desc",
      orderBy: "updatedAt",
    }),
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

test("検索に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
  const userId = "test-user-id";
  const query = "テスト";

  const book: Book = {
    id: bookId,
    userId,
    owner: "owner1",
    repo: "repo1",
    details: {
      name: "repo1",
      description: "owner1/repo1",
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const repoError = new RepositoryError(
    RepositoryErrorCode.SYSTEM_ERROR,
    "検索に失敗しました",
  );

  mockNoteRepository.search.mockReturnValue(errAsync(repoError));

  const service = new SearchNotesService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  // 実行
  const result = await service.execute({
    bookId,
    query,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  // 検証
  expect(mockNoteRepository.search).toHaveBeenCalledWith(
    bookId,
    query,
    expect.objectContaining({
      page: 1,
      limit: 10,
      order: "desc",
      orderBy: "updatedAt",
    }),
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

