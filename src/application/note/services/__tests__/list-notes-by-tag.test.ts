import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { Profile } from "@/domain/account/models";
import type { Note, Tag } from "@/domain/note/models";
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
import { ListNotesByTagService } from "../list-notes-by-tag";

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

// テスト用のブックとノートを作成するヘルパー関数
async function createTestBookWithNotes(userId: string) {
  // ブックを作成
  const createBookResult = await bookRepository.create({
    userId,
    owner: "owner1",
    repo: "repo1",
    details: {
      name: "repo1",
      description: "owner1/repo1",
    },
    syncStatus: {
      lastSyncedAt: new Date(),
      status: SyncStatusCode.SYNCED,
    },
  });

  if (createBookResult.isErr()) {
    throw new Error("テストブックの作成に失敗しました");
  }

  const bookId = createBookResult.value.id;

  // タグ付きのノートを複数作成
  const notesData = [
    {
      bookId,
      userId,
      path: "/path/to/note1.md",
      title: "ノート1",
      body: "ノート1の本文",
      scope: NoteScope.PUBLIC,
      tags: ["タグ1", "共通タグ"],
    },
    {
      bookId,
      userId,
      path: "/path/to/note2.md",
      title: "ノート2",
      body: "ノート2の本文",
      scope: NoteScope.PUBLIC,
      tags: ["タグ2", "共通タグ"],
    },
    {
      bookId,
      userId,
      path: "/path/to/note3.md",
      title: "ノート3",
      body: "ノート3の本文",
      scope: NoteScope.PUBLIC,
      tags: ["タグ1", "タグ3"],
    },
  ];

  const createdNotes: Note[] = [];
  for (const noteData of notesData) {
    const createNoteResult = await noteRepository.createOrUpdate(noteData);
    if (createNoteResult.isErr()) {
      throw new Error("テストノートの作成に失敗しました");
    }
    createdNotes.push(createNoteResult.value);
  }

  return { book: createBookResult.value, notes: createdNotes };
}

// タグIDを取得する関数
function findTagByName(notes: Note[], tagName: string): string {
  for (const note of notes) {
    for (const tag of note.tags) {
      if (tag.name === tagName) {
        return tag.id;
      }
    }
  }
  throw new Error(`タグ「${tagName}」が見つかりませんでした`);
}

test("有効なブックとタグが指定された場合にノート一覧が返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // テスト用のブックとノートを作成
  const { book, notes } = await createTestBookWithNotes(userId);
  const bookId = book.id;

  // 「タグ1」でフィルタリングする
  const tagId = findTagByName(notes, "タグ1");

  const service = new ListNotesByTagService({
    deps: {
      noteRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, tagId });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    // タグ1を持つノートは2つ
    expect(result.value.count).toBe(2);
    // 各ノートにタグ1が含まれていることを確認
    for (const note of result.value.items) {
      const hasTag1 = note.tags.some((tag) => tag.name === "タグ1");
      expect(hasTag1).toBe(true);
    }
  }
});

test("存在しないブックIDを指定した場合に空のリストが返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // テスト用のブックとノートを作成
  const { notes } = await createTestBookWithNotes(userId);

  // 存在しないブックID
  const nonExistingBookId = generateId("Book");
  const tagId = findTagByName(notes, "タグ1");

  const service = new ListNotesByTagService({
    deps: {
      noteRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId: nonExistingBookId, tagId });

  // 検証：存在しないブックIDの場合も空のリストが返される
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.count).toBe(-1); // データベースからの結果で-1が返される
    expect(result.value.items).toHaveLength(0);
  }
});

test("存在しないタグIDを指定した場合に空のリストが返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // テスト用のブックとノートを作成
  const { book } = await createTestBookWithNotes(userId);
  const bookId = book.id;

  // 存在しないタグID
  const nonExistingTagId = generateId("Tag");

  const service = new ListNotesByTagService({
    deps: {
      noteRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId, tagId: nonExistingTagId });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.count).toBe(-1); // データベースからの結果で-1が返される
    expect(result.value.items).toHaveLength(0);
  }
});
