import { expect, test, vi, beforeEach } from "vitest";
import { ListBooksService } from "../list-books";
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

test("ブック一覧が正常に取得された場合にブック一覧が返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const books: Book[] = [
    {
      id: "book-id-1",
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
    },
    {
      id: "book-id-2",
      userId,
      owner: "owner2",
      repo: "repo2",
      details: {
        name: "repo2",
        description: "owner2/repo2",
      },
      syncStatus: {
        lastSyncedAt: null,
        status: SyncStatusCode.SYNCED,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  mockBookRepository.findByUserId.mockReturnValue(okAsync(books));

  const service = new ListBooksService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockBookRepository.findByUserId).toHaveBeenCalledWith(userId);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(books);
    expect(result.value.length).toBe(2);
  }
});

test("ブック一覧の取得に失敗した場合にエラーが返されること", async () => {
  // テストの準備
  const userId = "test-user-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.SYSTEM_ERROR,
    "データベースエラー",
  );

  mockBookRepository.findByUserId.mockReturnValue(errAsync(repoError));

  const service = new ListBooksService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockBookRepository.findByUserId).toHaveBeenCalledWith(userId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(NoteError);
    expect(result.error.code).toBe(NoteErrorCode.BOOK_NOT_FOUND);
    expect(result.error.cause).toBe(repoError);
  }
});

