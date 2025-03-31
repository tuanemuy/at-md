import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { Profile } from "@/domain/account/models";
import type { Book, Note } from "@/domain/note/models";
import { NoteScope } from "@/domain/note/models/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { DrizzleBookRepository } from "@/infrastructure/db/repositories/note/book-repository";
import { DrizzleNoteRepository } from "@/infrastructure/db/repositories/note/note-repository";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test } from "vitest";
import { GetNoteService } from "../get-note";

// データベース関連の変数
let client: PGlite;
let userRepository: DrizzleUserRepository;
let bookRepository: DrizzleBookRepository;
let noteRepository: DrizzleNoteRepository;

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  userRepository = new DrizzleUserRepository(db);
  bookRepository = new DrizzleBookRepository(db);
  noteRepository = new DrizzleNoteRepository(db);
});

afterEach(async () => {
  // テスト用のデータベースをクリーンアップ
  await cleanupTestDatabase(client);
  await closeTestDatabase(client);
});

// テスト用ユーザーを作成するヘルパー関数
async function createTestUser() {
  const did = `did:plc:${generateId("DID")}`;
  const profile: Profile = {
    displayName: "Test User",
    description: "テスト用ユーザー",
    avatarUrl: null,
    bannerUrl: null,
  };

  const createUserResult = await userRepository.create({
    did,
    profile,
  });

  if (createUserResult.isErr()) {
    console.error("ユーザーの作成に失敗:", createUserResult.error);
    throw new Error("テストユーザーの作成に失敗しました");
  }

  return createUserResult.value;
}

test("有効なブックとノートが指定された場合にノートが返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // テスト用のブックを作成
  const owner = "owner1";
  const repo = "repo1";
  const createBookResult = await bookRepository.create({
    userId,
    owner,
    repo,
    details: {
      name: "テストブック",
      description: "テスト用のブックです",
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
  });

  expect(createBookResult.isOk()).toBe(true);
  const bookId = createBookResult.isOk() ? createBookResult.value.id : "";

  // テスト用のノートを作成
  const path = "/path/to/note.md";
  const createNoteResult = await noteRepository.createOrUpdate({
    userId,
    bookId,
    path,
    title: "テストノート",
    body: "テストノートの本文",
    scope: NoteScope.PUBLIC,
    tags: [],
  });

  expect(createNoteResult.isOk()).toBe(true);
  const noteId = createNoteResult.isOk() ? createNoteResult.value.id : "";

  // サービスのインスタンスを作成して実行
  const service = new GetNoteService({
    deps: {
      noteRepository,
    },
  });

  const result = await service.execute({ noteId });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.id).toBe(noteId);
    expect(result.value.userId).toBe(userId);
    expect(result.value.bookId).toBe(bookId);
    expect(result.value.path).toBe(path);
    expect(result.value.title).toBe("テストノート");
    expect(result.value.body).toBe("テストノートの本文");
    expect(result.value.scope).toBe(NoteScope.PUBLIC);
  }
});

test("ノートが存在しない場合にエラーが返されること", async () => {
  const nonExistingNoteId = generateId("Note");

  const service = new GetNoteService({
    deps: {
      noteRepository,
    },
  });

  const result = await service.execute({ noteId: nonExistingNoteId });

  // 検証
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBeInstanceOf(RepositoryError);
    expect((result.error.cause as RepositoryError).code).toBe(
      RepositoryErrorCode.NOT_FOUND,
    );
  }
});
