import type { Note } from "@/domain/note/models";
import { NoteScope } from "@/domain/note/models/note";
import type { NoteRepository } from "@/domain/note/repositories";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { errAsync, okAsync } from "@/lib/result";
import { beforeEach, expect, test, vi } from "vitest";
import { SearchNotesService } from "../search-notes";

const mockNoteRepository = {
  createOrUpdate: vi.fn(),
  findById: vi.fn(),
  findByBookId: vi.fn(),
  findByTag: vi.fn(),
  search: vi.fn(),
  delete: vi.fn(),
  deleteByPath: vi.fn(),
} as unknown as NoteRepository;

beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なブックと検索クエリが指定された場合にノート一覧が返されること", async () => {
  const bookId = generateId("Book");
  const userId = generateId("User");
  const query = "テスト";

  const notes: Note[] = [
    {
      id: generateId("Note"),
      userId,
      bookId,
      path: "/path/to/note1.md",
      title: "テストノート1",
      body: "テストノート1の本文",
      scope: NoteScope.PUBLIC,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: generateId("Note"),
      userId,
      bookId,
      path: "/path/to/note2.md",
      title: "テストノート2",
      body: "テストノート2の本文",
      scope: NoteScope.PUBLIC,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockNoteRepository.search as any).mockReturnValue(
    okAsync({
      items: notes,
      count: notes.length,
    }),
  );

  const service = new SearchNotesService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  const result = await service.execute({
    bookId,
    query,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  expect(mockNoteRepository.search).toHaveBeenCalledWith(
    bookId,
    query,
    expect.objectContaining({
      page: 1,
      limit: 10,
      order: "desc",
      orderBy: "updatedAt",
    }),
  );
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.items).toEqual(notes);
    expect(result.value.count).toBe(2);
  }
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  const bookId = generateId("Book");
  const query = "test";
  const errorId = generateId("Error");

  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `ブックが見つかりません (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockNoteRepository.search as any).mockReturnValue(errAsync(repoError));

  const service = new SearchNotesService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  const result = await service.execute({
    bookId,
    query,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  expect(mockNoteRepository.search).toHaveBeenCalledWith(
    bookId,
    query,
    expect.objectContaining({
      page: 1,
      limit: 10,
      order: "desc",
      orderBy: "updatedAt",
    }),
  );
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

test("検索エラーが発生した場合にエラーが返されること", async () => {
  const bookId = generateId("Book");
  const query = "test";
  const errorId = generateId("Error");

  const repoError = new RepositoryError(
    RepositoryErrorCode.SYSTEM_ERROR,
    `検索エラーが発生しました (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockNoteRepository.search as any).mockReturnValue(errAsync(repoError));

  const service = new SearchNotesService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  const result = await service.execute({
    bookId,
    query,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  expect(mockNoteRepository.search).toHaveBeenCalledWith(
    bookId,
    query,
    expect.objectContaining({
      page: 1,
      limit: 10,
      order: "desc",
      orderBy: "updatedAt",
    }),
  );
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});
