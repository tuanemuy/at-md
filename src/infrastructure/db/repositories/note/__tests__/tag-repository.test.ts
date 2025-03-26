import type { Tag } from "@/domain/note/models";
import { NoteScope } from "@/domain/note/models/note";
import { PGlite } from "@electric-sql/pglite";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "../../../__test__/setup";
import { users } from "../../../schema/account";
import { books, noteTags, notes, tags } from "../../../schema/note";
import { DrizzleTagRepository } from "../tag-repository";

// テスト用のデータベース
let client: PGlite;
let tagRepository: DrizzleTagRepository;
let testUserId: string;
let testBookId: string;
let testNoteId: string;

// テスト用のタグデータを作成する関数
const createTestTag = (bookId: string): Tag => ({
  id: uuidv7(),
  bookId,
  name: `タグ-${Math.floor(Math.random() * 1000)}`,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// テストの前に一度だけDBをセットアップ
beforeAll(async () => {
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  tagRepository = new DrizzleTagRepository(db);
});

// 各テストの前にデータをクリーンアップし、テスト用ユーザーとノートを作成
beforeEach(async () => {
  await cleanupTestDatabase(client);

  // テスト用データを作成
  const db = getTestDatabase(client);

  // テスト用ユーザーを作成
  testUserId = uuidv7();
  await db.insert(users).values({
    id: testUserId,
    did: `did:example:${testUserId}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // テスト用ブックを作成
  testBookId = uuidv7();
  await db.insert(books).values({
    id: testBookId,
    userId: testUserId,
    owner: "testOwner",
    repo: "testRepo",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // テスト用ノートを作成
  testNoteId = uuidv7();
  await db.insert(notes).values({
    id: testNoteId,
    userId: testUserId,
    bookId: testBookId,
    path: `test-note-${Math.floor(Math.random() * 1000)}.md`,
    title: "テストノート",
    body: "# テストノート\nこれはテスト用のノートです。",
    scope: NoteScope.PUBLIC,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

// テストの後にDBを閉じる
afterAll(async () => {
  await closeTestDatabase(client);
});

test("指定したノートIDのタグ一覧を取得できること", async () => {
  // 準備 - 複数のタグを作成
  const db = getTestDatabase(client);
  const testTags = [
    createTestTag(testBookId),
    createTestTag(testBookId),
    createTestTag(testBookId),
  ];

  // タグをデータベースに保存
  await db.insert(tags).values(testTags);

  // タグとノートを関連付ける
  await Promise.all(
    testTags.map((tag) =>
      db.insert(noteTags).values({
        noteId: testNoteId,
        tagId: tag.id,
      }),
    ),
  );

  // 実行
  const result = await tagRepository.findByNoteId(testNoteId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((foundTags) => {
    expect(foundTags.length).toBe(testTags.length);
    // 各タグがタグスキーマに準拠していることを確認
    for (const tag of foundTags) {
      expect(tag.id).toBeDefined();
      expect(tag.bookId).toBe(testBookId);
      expect(tag.name).toBeDefined();
      expect(tag.createdAt).toBeInstanceOf(Date);
      expect(tag.updatedAt).toBeInstanceOf(Date);
    }
  });
});

test("存在しないノートIDのタグ一覧を取得すると空配列が返されること", async () => {
  // 準備
  const nonExistentNoteId = uuidv7();

  // 実行
  const result = await tagRepository.findByNoteId(nonExistentNoteId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((tags) => {
    expect(tags).toEqual([]);
  });
});

test("未使用のタグを削除できること", async () => {
  // 準備
  const db = getTestDatabase(client);

  // 使用されているタグと使用されていないタグを作成
  const usedTag = createTestTag(testBookId);
  const unusedTag = createTestTag(testBookId);

  // タグをデータベースに保存
  await db.insert(tags).values([usedTag, unusedTag]);

  // usedTagのみノートと関連付ける
  await db.insert(noteTags).values({
    noteId: testNoteId,
    tagId: usedTag.id,
  });

  // 実行
  const result = await tagRepository.deleteUnused();

  // 検証
  expect(result.isOk()).toBe(true);

  // 使用されているタグは残っているが、未使用のタグは削除されていることを確認
  const remainingTags = await db.select().from(tags);
  expect(remainingTags.length).toBe(1);
  expect(remainingTags[0].id).toBe(usedTag.id);
});
