import { expect, test, vi, beforeEach } from "vitest";
import { DeleteBookService } from "../delete-book";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";

const mockBookRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findByOwnerAndRepo: vi.fn(),
  delete: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

test("ブックの所有者が削除した場合に成功すること", async () => {
  const bookId = "test-book-id";
  const userId = "test-user-id";

  mockBookRepository.delete.mockReturnValue(okAsync(undefined));

  const service = new DeleteBookService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  const result = await service.execute({ userId, bookId });

  expect(mockBookRepository.delete).toHaveBeenCalledWith(bookId, userId);
  expect(result.isOk()).toBe(true);
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  const bookId = "non-existing-book-id";
  const userId = "test-user-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "ブックが見つかりません",
  );

  mockBookRepository.delete.mockReturnValue(errAsync(repoError));

  const service = new DeleteBookService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  const result = await service.execute({ userId, bookId });

  expect(mockBookRepository.delete).toHaveBeenCalledWith(bookId, userId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

test("所有者でないユーザーが削除しようとした場合にエラーが返されること", async () => {
  const bookId = "test-book-id";
  const userId = "test-user-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "このブックを削除する権限がありません",
  );

  mockBookRepository.delete.mockReturnValue(errAsync(repoError));

  const service = new DeleteBookService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  const result = await service.execute({ userId, bookId });

  expect(mockBookRepository.delete).toHaveBeenCalledWith(bookId, userId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

test("削除処理に失敗した場合にエラーが返されること", async () => {
  const bookId = "test-book-id";
  const userId = "test-user-id";
  const repoError = new RepositoryError(
    RepositoryErrorCode.SYSTEM_ERROR,
    "データベースエラー",
  );

  mockBookRepository.delete.mockReturnValue(errAsync(repoError));

  const service = new DeleteBookService({
    deps: {
      bookRepository: mockBookRepository,
    },
  });

  const result = await service.execute({ userId, bookId });

  expect(mockBookRepository.delete).toHaveBeenCalledWith(bookId, userId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

