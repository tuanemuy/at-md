import { expect, test, vi, beforeEach } from "vitest";
import { ListTagsService } from "../list-tags";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { Tag } from "@/domain/note/models";
import { generateId } from "@/domain/types/id";
import type { TagRepository } from "@/domain/note/repositories";

const mockTagRepository = {
  findByNoteId: vi.fn(),
  findByBookId: vi.fn(),
  deleteUnused: vi.fn(),
} as unknown as TagRepository;

beforeEach(() => {
  vi.resetAllMocks();
});

test("ブックが存在する場合にタグ一覧が返されること", async () => {
  const bookId = generateId("Book");

  const tags: Tag[] = [
    {
      id: generateId("Tag"),
      bookId,
      name: "タグ1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: generateId("Tag"),
      bookId,
      name: "タグ2",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  (mockTagRepository.findByBookId as any).mockReturnValue(okAsync(tags));

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
  const bookId = generateId("Book");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `ブックが見つかりません (${errorId})`,
  );

  (mockTagRepository.findByBookId as any).mockReturnValue(errAsync(repoError));

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
  const bookId = generateId("Book");
  const errorId = generateId("Error");

  const repoError = new RepositoryError(
    RepositoryErrorCode.SYSTEM_ERROR,
    `データベースエラー (${errorId})`,
  );

  (mockTagRepository.findByBookId as any).mockReturnValue(errAsync(repoError));

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

