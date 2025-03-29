import { expect, test, vi, beforeEach } from "vitest";
import { GetNoteService } from "../get-note";
import { okAsync, errAsync } from "@/lib/result";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
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

test("有効なブックとノートが指定された場合にノートが返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
  const noteId = "test-note-id";
  const userId = "test-user-id";

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

  const note: Note = {
    id: noteId,
    userId,
    bookId,
    path: "/path/to/note.md",
    title: "テストノート",
    body: "テストノートの本文",
    scope: NoteScope.PUBLIC,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockBookRepository.findById.mockReturnValue(okAsync(book));
  mockNoteRepository.findById.mockReturnValue(okAsync(note));

  const service = new GetNoteService({
    deps: {
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, noteId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockNoteRepository.findById).toHaveBeenCalledWith(noteId);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(note);
  }
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "non-existing-book-id";
  const noteId = "test-note-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "ブックが見つかりません",
  );

  mockBookRepository.findById.mockReturnValue(errAsync(repoError));

  const service = new GetNoteService({
    deps: {
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, noteId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockNoteRepository.findById).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.BOOK_NOT_FOUND);
    expect(result.error.cause).toBe(repoError);
  }
});

test("ノートが存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
  const noteId = "non-existing-note-id";
  const userId = "test-user-id";

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
    RepositoryErrorCode.NOT_FOUND,
    "ノートが見つかりません",
  );

  mockBookRepository.findById.mockReturnValue(okAsync(book));
  mockNoteRepository.findById.mockReturnValue(errAsync(repoError));

  const service = new GetNoteService({
    deps: {
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, noteId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockNoteRepository.findById).toHaveBeenCalledWith(noteId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.NOTE_NOT_FOUND);
    expect(result.error.cause).toBe(repoError);
  }
});

test("ノートが指定されたブックに属していない場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
  const noteId = "test-note-id";
  const userId = "test-user-id";
  const differentBookId = "different-book-id";

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

  const note: Note = {
    id: noteId,
    userId,
    bookId: differentBookId, // 異なるブックに属している
    path: "/path/to/note.md",
    title: "テストノート",
    body: "テストノートの本文",
    scope: NoteScope.PUBLIC,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockBookRepository.findById.mockReturnValue(okAsync(book));
  mockNoteRepository.findById.mockReturnValue(okAsync(note));

  const service = new GetNoteService({
    deps: {
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, noteId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockNoteRepository.findById).toHaveBeenCalledWith(noteId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.NOTE_NOT_FOUND);
  }
});

