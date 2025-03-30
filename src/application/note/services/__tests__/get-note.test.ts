import { expect, test, vi, beforeEach } from "vitest";
import { GetNoteService } from "../get-note";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { Book, Note } from "@/domain/note/models";
import { NoteScope } from "@/domain/note/models/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import { generateId } from "@/domain/types/id";
import type { NoteRepository } from "@/domain/note/repositories";

const mockNoteRepository = {
  createOrUpdate: vi.fn(),
  findById: vi.fn(),
  findByBookId: vi.fn(),
  findByTag: vi.fn(),
  search: vi.fn(),
  delete: vi.fn(),
  deleteByPath: vi.fn(),
} as unknown as NoteRepository;

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なブックとノートが指定された場合にノートが返されること", async () => {
  // テストの準備
  const bookId = generateId("Book");
  const noteId = generateId("Note");
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

  const note: Note = {
    id: noteId,
    userId,
    bookId,
    path: "/path/to/note.md",
    title: "テストノート",
    body: "テストノートの本文",
    scope: NoteScope.PUBLIC,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  (mockNoteRepository.findById as any).mockReturnValue(okAsync(note));

  const service = new GetNoteService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  // 実行
  const result = await service.execute({ noteId });

  // 検証
  expect(mockNoteRepository.findById).toHaveBeenCalledWith(noteId);
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(note);
  }
});

test("ノートが存在しない場合にエラーが返されること", async () => {
  // テストの準備
  const bookId = generateId("Book");
  const noteId = generateId("Note");
  const userId = generateId("User");
  const errorId = generateId("Error");

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
    RepositoryErrorCode.NOT_FOUND,
    `ノートが見つかりません (${errorId})`,
  );

  (mockNoteRepository.findById as any).mockReturnValue(errAsync(repoError));

  const service = new GetNoteService({
    deps: {
      noteRepository: mockNoteRepository,
    },
  });

  // 実行
  const result = await service.execute({ noteId });

  // 検証
  expect(mockNoteRepository.findById).toHaveBeenCalledWith(noteId);
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

