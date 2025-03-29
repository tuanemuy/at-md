import { expect, test, vi, beforeEach } from "vitest";
import { ListNotesByTagService } from "../list-notes-by-tag";
import { okAsync, errAsync } from "@/lib/result";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { Book, Note, Tag } from "@/domain/note/models";
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

const mockTagRepository = {
  findByNoteId: vi.fn(),
  findByBookId: vi.fn(),
  deleteUnused: vi.fn(),
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

test("有効なブックとタグが指定された場合にノート一覧が返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
  const tagId = "test-tag-id";
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

  const tags: Tag[] = [
    {
      id: tagId,
      bookId,
      name: "タグ1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "tag-id-2",
      bookId,
      name: "タグ2",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const notes: Note[] = [
    {
      id: "note-id-1",
      userId,
      bookId,
      path: "/path/to/note1.md",
      title: "ノート1",
      body: "ノート1の本文",
      scope: NoteScope.PUBLIC,
      tags: [tags[0]],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "note-id-2",
      userId,
      bookId,
      path: "/path/to/note2.md",
      title: "ノート2",
      body: "ノート2の本文",
      scope: NoteScope.PUBLIC,
      tags: [tags[0], tags[1]],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  mockBookRepository.findById.mockReturnValue(okAsync(book));
  mockTagRepository.findByBookId.mockReturnValue(okAsync(tags));
  mockNoteRepository.findByTag.mockReturnValue(
    okAsync({
      items: notes,
      count: notes.length,
    }),
  );

  const service = new ListNotesByTagService({
    deps: {
      noteRepository: mockNoteRepository,
      tagRepository: mockTagRepository,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, tagId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockTagRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(mockNoteRepository.findByTag).toHaveBeenCalledWith(bookId, tagId);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(notes);
    expect(result.value.length).toBe(2);
  }
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "non-existing-book-id";
  const tagId = "test-tag-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "ブックが見つかりません",
  );

  mockBookRepository.findById.mockReturnValue(errAsync(repoError));

  const service = new ListNotesByTagService({
    deps: {
      noteRepository: mockNoteRepository,
      tagRepository: mockTagRepository,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, tagId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockTagRepository.findByBookId).not.toHaveBeenCalled();
  expect(mockNoteRepository.findByTag).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.BOOK_NOT_FOUND);
    expect(result.error.cause).toBe(repoError);
  }
});

test("タグの取得に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
  const tagId = "test-tag-id";
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
    RepositoryErrorCode.SYSTEM_ERROR,
    "データベースエラー",
  );

  mockBookRepository.findById.mockReturnValue(okAsync(book));
  mockTagRepository.findByBookId.mockReturnValue(errAsync(repoError));

  const service = new ListNotesByTagService({
    deps: {
      noteRepository: mockNoteRepository,
      tagRepository: mockTagRepository,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, tagId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockTagRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(mockNoteRepository.findByTag).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.TAG_NOT_FOUND);
    expect(result.error.cause).toBe(repoError);
  }
});

test("指定されたタグがブックに存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
  const tagId = "non-existing-tag-id";
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

  const tags: Tag[] = [
    {
      id: "tag-id-1",
      bookId,
      name: "タグ1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "tag-id-2",
      bookId,
      name: "タグ2",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  mockBookRepository.findById.mockReturnValue(okAsync(book));
  mockTagRepository.findByBookId.mockReturnValue(okAsync(tags));

  const service = new ListNotesByTagService({
    deps: {
      noteRepository: mockNoteRepository,
      tagRepository: mockTagRepository,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, tagId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockTagRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(mockNoteRepository.findByTag).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.TAG_NOT_FOUND);
  }
});

test("ノート一覧の取得に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
  const tagId = "test-tag-id";
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

  const tags: Tag[] = [
    {
      id: tagId,
      bookId,
      name: "タグ1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const repoError = new RepositoryError(
    RepositoryErrorCode.SYSTEM_ERROR,
    "データベースエラー",
  );

  mockBookRepository.findById.mockReturnValue(okAsync(book));
  mockTagRepository.findByBookId.mockReturnValue(okAsync(tags));
  mockNoteRepository.findByTag.mockReturnValue(errAsync(repoError));

  const service = new ListNotesByTagService({
    deps: {
      noteRepository: mockNoteRepository,
      tagRepository: mockTagRepository,
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, tagId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockTagRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(mockNoteRepository.findByTag).toHaveBeenCalledWith(bookId, tagId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.NOTE_NOT_FOUND);
    expect(result.error.cause).toBe(repoError);
  }
});

