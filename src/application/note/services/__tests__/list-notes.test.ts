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
import { ListNotesService } from "../list-notes";

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

test("有効なブックが指定された場合にノート一覧が返されること", async () => {
  const bookId = generateId("Book");
  const userId = generateId("User");

  const notes: Note[] = [
    {
      id: generateId("Note"),
      userId,
      bookId,
      path: "/path/to/note1.md",
      title: "ノート1",
      body: "ノート1の本文",
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
      title: "ノート2",
      body: "ノート2の本文",
      scope: NoteScope.PUBLIC,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockNoteRepository.findByBookId as any).mockReturnValue(
    okAsync({
      items: notes,
      count: notes.length,
    }),
  );

  const service = new ListNotesService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  const result = await service.execute({
    bookId,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  expect(mockNoteRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.items).toEqual(notes);
    expect(result.value.count).toBe(2);
  }
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  const bookId = generateId("Book");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `ブックが見つかりません (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockNoteRepository.findByBookId as any).mockReturnValue(errAsync(repoError));

  const service = new ListNotesService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  const result = await service.execute({
    bookId,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  expect(mockNoteRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

test("ノート一覧の取得に失敗した場合にエラーが返されること", async () => {
  const bookId = generateId("Book");
  const errorId = generateId("Error");
  const repoError = new RepositoryError(
    RepositoryErrorCode.SYSTEM_ERROR,
    `データベースエラー (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockNoteRepository.findByBookId as any).mockReturnValue(errAsync(repoError));

  const service = new ListNotesService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  const result = await service.execute({
    bookId,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  expect(mockNoteRepository.findByBookId).toHaveBeenCalledWith(bookId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});
