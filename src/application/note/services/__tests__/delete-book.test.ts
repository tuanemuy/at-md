import { expect, test, vi, beforeEach } from "vitest";
import { DeleteBookService } from "../delete-book";
import { okAsync, errAsync } from "@/lib/result";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { Book } from "@/domain/note/models";
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

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("ブックの所有者が削除した場合に成功すること", async () => {
  // テストの準備
  const bookId = "test-book-id";
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

  mockBookRepository.findById.mockReturnValue(okAsync(book));
  mockBookRepository.delete.mockReturnValue(okAsync(undefined));

  const service = new DeleteBookService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, bookId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockBookRepository.delete).toHaveBeenCalledWith(bookId);
  expect(result.isOk()).toBe(true);
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "non-existing-book-id";
  const userId = "test-user-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "ブックが見つかりません",
  );

  mockBookRepository.findById.mockReturnValue(errAsync(repoError));

  const service = new DeleteBookService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, bookId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockBookRepository.delete).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.BOOK_NOT_FOUND);
    expect(result.error.cause).toBe(repoError);
  }
});

test("所有者でないユーザーが削除しようとした場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
  const userId = "test-user-id";
  const ownerUserId = "owner-user-id";
  const book: Book = {
    id: bookId,
    userId: ownerUserId, // 別のユーザーが所有者
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

  mockBookRepository.findById.mockReturnValue(okAsync(book));

  const service = new DeleteBookService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, bookId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockBookRepository.delete).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.INVALID_REPOSITORY);
  }
});

test("削除処理に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "test-book-id";
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
  mockBookRepository.delete.mockReturnValue(errAsync(repoError));

  const service = new DeleteBookService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, bookId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(mockBookRepository.delete).toHaveBeenCalledWith(bookId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.INVALID_REPOSITORY);
    expect(result.error.cause).toBe(repoError);
  }
});

