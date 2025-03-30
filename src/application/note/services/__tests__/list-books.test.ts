import { expect, test, vi, beforeEach } from "vitest";
import { ListBooksService } from "../list-books";
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

test("ブック一覧が正常に取得された場合にブック一覧が返されること", async () => {
  // テストの準備
  const userId = generateId("User");
  const books: Book[] = [
    {
      id: generateId("Book"),
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
      id: generateId("Book"),
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

  (mockBookRepository.findByUserId as any).mockReturnValue(okAsync(books));

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
  const userId = generateId("User");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.SYSTEM_ERROR,
    `データベースエラー (${errorId})`,
  );

  (mockBookRepository.findByUserId as any).mockReturnValue(errAsync(repoError));

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
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

