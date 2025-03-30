import { expect, test, vi, beforeEach } from "vitest";
import { ListTagsService } from "../list-tags";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { Tag } from "@/domain/note/models";

const mockTagRepository = {
  findByNoteId: vi.fn(),
  findByBookId: vi.fn(),
  deleteUnused: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

test("ブックが存在する場合にタグ一覧が返されること", async () => {
  const bookId = "test-book-id";

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

  const result = await service.execute({ bookId });

  expect(mockTagRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(tags);
    expect(result.value.length).toBe(2);
  }
});

test("ブックが存在しない場合にエラーが返されること", async () => {
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

  const result = await service.execute({ bookId });

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
  const bookId = "test-book-id";

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

  const result = await service.execute({ bookId });

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

