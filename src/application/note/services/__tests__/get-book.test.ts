import { expect, test, vi, beforeEach } from "vitest";
import { GetBookService } from "../get-book";
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

test("ブックが存在する場合にブック情報が返されること", async () => {
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

  const service = new GetBookService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(book);
  }
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "non-existing-book-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "ブックが見つかりません",
  );

  mockBookRepository.findById.mockReturnValue(errAsync(repoError));

  const service = new GetBookService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId });

  // 検証
  expect(mockBookRepository.findById).toHaveBeenCalledWith(bookId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.BOOK_NOT_FOUND);
    expect(result.error.cause).toBe(repoError);
  }
});

