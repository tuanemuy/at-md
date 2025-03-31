import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { Profile } from "@/domain/account/models";
import type { Note } from "@/domain/note/models";
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
import { ListNotesService } from "../list-notes";

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

test("有効なブックが指定された場合にノート一覧が返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // テスト用のブックを作成
  const owner = "test-owner";
  const repo = "test-repo";
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
  await noteRepository.createOrUpdate({
    userId,
    bookId,
    path: "/path/to/note1.md",
    title: "ノート1",
    body: "ノート1の本文",
    scope: NoteScope.PUBLIC,
    tags: [],
  });

  await noteRepository.createOrUpdate({
    userId,
    bookId,
    path: "/path/to/note2.md",
    title: "ノート2",
    body: "ノート2の本文",
    scope: NoteScope.PUBLIC,
    tags: [],
  });

  // サービスのインスタンスを作成
  const service = new ListNotesService({
    deps: {
      noteRepository,
    },
  });

  // 実行
  const result = await service.execute({
    bookId,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.items.length).toBe(2);

    // ノートのタイトルを確認
    const titles = result.value.items.map((note) => note.title).sort();
    expect(titles).toEqual(["ノート1", "ノート2"]);

    // 各ノートの基本的な情報を確認
    for (const note of result.value.items) {
      expect(note.userId).toBe(userId);
      expect(note.bookId).toBe(bookId);
      expect(note.scope).toBe(NoteScope.PUBLIC);
    }
  }
});

test("存在しないブックIDでノート一覧を取得すると空リストが返されること", async () => {
  const nonExistingBookId = generateId("Book");

  const service = new ListNotesService({
    deps: {
      noteRepository,
    },
  });

  const result = await service.execute({
    bookId: nonExistingBookId,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  // 検証: 実装によっては空リストが返される場合もある
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.items.length).toBe(0);
  }
});

test("ブックにノートが存在しない場合に空配列が返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // テスト用のブックを作成
  const owner = "test-owner";
  const repo = "test-repo";
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

  // ノートは作成しない

  const service = new ListNotesService({
    deps: {
      noteRepository,
    },
  });

  const result = await service.execute({
    bookId,
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.items.length).toBe(0);
  }
});
