import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { Profile } from "@/domain/account/models";
import type { Tag } from "@/domain/note/models";
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
import { DrizzleTagRepository } from "@/infrastructure/db/repositories/note/tag-repository";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test } from "vitest";
import { ListTagsService } from "../list-tags";

// データベース関連の変数
let client: PGlite;
let userRepository: DrizzleUserRepository;
let bookRepository: DrizzleBookRepository;
let noteRepository: DrizzleNoteRepository;
let tagRepository: DrizzleTagRepository;

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  userRepository = new DrizzleUserRepository(db);
  bookRepository = new DrizzleBookRepository(db);
  noteRepository = new DrizzleNoteRepository(db);
  tagRepository = new DrizzleTagRepository(db);
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

test("ブックが存在する場合にタグ一覧が返されること", async () => {
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

  // テスト用のノートを作成（タグ付きで）
  await noteRepository.createOrUpdate({
    userId,
    bookId,
    path: "/path/to/note1.md",
    title: "ノート1",
    body: "ノート1の本文",
    scope: NoteScope.PUBLIC,
    tags: ["タグ1", "タグ2"],
  });

  await noteRepository.createOrUpdate({
    userId,
    bookId,
    path: "/path/to/note2.md",
    title: "ノート2",
    body: "ノート2の本文",
    scope: NoteScope.PUBLIC,
    tags: ["タグ2", "タグ3"],
  });

  // サービスのインスタンスを作成
  const service = new ListTagsService({
    deps: {
      tagRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.length).toBe(3);

    // タグ名を抽出して検証
    const tagNames = result.value.map((tag) => tag.name).sort();
    expect(tagNames).toEqual(["タグ1", "タグ2", "タグ3"]);

    // すべてのタグが同じブックIDを持っていることを確認
    for (const tag of result.value) {
      expect(tag.bookId).toBe(bookId);
    }
  }
});

test("ブックが存在するがタグがない場合に空配列が返されること", async () => {
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

  // タグのないノートを作成
  await noteRepository.createOrUpdate({
    userId,
    bookId,
    path: "/path/to/note1.md",
    title: "ノート1",
    body: "ノート1の本文",
    scope: NoteScope.PUBLIC,
    tags: [],
  });

  const service = new ListTagsService({
    deps: {
      tagRepository,
    },
  });

  const result = await service.execute({ bookId });

  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual([]);
    expect(result.value.length).toBe(0);
  }
});

test("存在しないブックIDでタグを検索すると空配列が返されること", async () => {
  const nonExistingBookId = generateId("Book");

  const service = new ListTagsService({
    deps: {
      tagRepository,
    },
  });

  const result = await service.execute({ bookId: nonExistingBookId });

  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual([]);
    expect(result.value.length).toBe(0);
  }
});
