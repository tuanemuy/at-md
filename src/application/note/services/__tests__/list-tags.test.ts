import { expect, test, vi, beforeEach } from "vitest";
import { ListTagsService } from "../list-tags";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { Book, Tag } from "@/domain/note/models";
import { SyncStatusCode } from "@/domain/note/models/sync-status";

// モックの作成

const mockTagRepository = {
  findByNoteId: vi.fn(),
  findByBookId: vi.fn(),
  deleteUnused: vi.fn(),
};

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("ブックが存在する場合にタグ一覧が返されること", async () => {
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

  mockTagRepository.findByBookId.mockReturnValue(okAsync(tags));

  const service = new ListTagsService({
    deps: {
      tagRepository: mockTagRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId });

  // 検証
  expect(mockTagRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(tags);
    expect(result.value.length).toBe(2);
  }
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = "non-existing-book-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "ブックが見つかりません",
  );

  mockTagRepository.findByBookId.mockReturnValue(errAsync(repoError));

  const service = new ListTagsService({
    deps: {
      tagRepository: mockTagRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId });

  // 検証
  expect(mockTagRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR
    );
    expect(result.error.cause).toBe(repoError);
  }
});

test("タグの取得に失敗した場合にエラーが返されること", async () => {
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

  mockTagRepository.findByBookId.mockReturnValue(errAsync(repoError));

  const service = new ListTagsService({
    deps: {
      tagRepository: mockTagRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId });

  // 検証
  expect(mockTagRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR
    );
    expect(result.error.cause).toBe(repoError);
  }
});

