import type { BookRepository } from "@/domain/note/repositories";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { errAsync, okAsync } from "@/lib/result";
import { beforeEach, expect, test, vi } from "vitest";
import { DeleteBookService } from "../delete-book";

const mockBookRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findByOwnerAndRepo: vi.fn(),
  delete: vi.fn(),
} as unknown as BookRepository;

beforeEach(() => {
  vi.resetAllMocks();
});

test("ブックの所有者が削除した場合に成功すること", async () => {
  const bookId = generateId("Book");
  const userId = generateId("User");

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.delete as any).mockReturnValue(okAsync(undefined));

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
  const bookId = generateId("Book");
  const userId = generateId("User");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `ブックが見つかりません (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.delete as any).mockReturnValue(errAsync(repoError));

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
  const bookId = generateId("Book");
  const userId = generateId("User");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `このブックを削除する権限がありません (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.delete as any).mockReturnValue(errAsync(repoError));

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
  const bookId = generateId("Book");
  const userId = generateId("User");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.SYSTEM_ERROR,
    `データベースエラー (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockBookRepository.delete as any).mockReturnValue(errAsync(repoError));

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
