import { expect, test, vi, beforeEach } from "vitest";
import { GetBookService } from "../get-book";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { Book } from "@/domain/note/models";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import { generateId } from "@/domain/types/id";
import type { BookRepository } from "@/domain/note/repositories";

// モックの作成
const mockBookRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findByOwnerAndRepo: vi.fn(),
  delete: vi.fn(),
} as unknown as BookRepository;

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("ブックが存在する場合にブック情報が返されること", async () => {
  // テストの準備
  const bookId = generateId("Book");
  const userId = generateId("User");
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

  (mockBookRepository.findById as any).mockReturnValue(okAsync(book));

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
  const bookId = generateId("Book");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `ブックが見つかりません (${errorId})`,
  );

  (mockBookRepository.findById as any).mockReturnValue(errAsync(repoError));

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
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

