import { expect, test, beforeEach, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { v7 as uuidv7 } from "uuid";
import type { Tag } from "@/domain/note/models";
import type { CreateTag, UpdateTag } from "@/domain/note/repositories";
import { DrizzleTagRepository } from "../tag-repository";
import { RepositoryErrorCode } from "@/domain/types/error";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
} from "../../../__test__/setup";
import { users } from "../../../schema/account";
import { notes, noteTags, books } from "../../../schema/note";
import { NoteScope } from "@/domain/note/models/note";

// テスト用のデータベース
let client: PGlite;
let tagRepository: DrizzleTagRepository;
let testUserId: string;
let testBookId: string;
let testNoteId: string;

// テスト用のタグデータを作成する関数
const createTestTag = (): Tag => ({
  id: uuidv7(),
  name: `タグ-${Math.floor(Math.random() * 1000)}`,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// テスト用のCreateTagデータを作成する関数
const createTestCreateTag = (): CreateTag => {
  const tag = createTestTag();
  return {
    name: tag.name,
  };
};

// テスト用のUpdateTagデータを作成する関数
const createTestUpdateTag = (id: string): UpdateTag => ({
  id,
  name: `更新された${Math.floor(Math.random() * 1000)}`,
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

test("新規タグを作成するとタグが正常に作成されること", async () => {
  // 準備
  const testTag = createTestCreateTag();

  // 実行
  const result = await tagRepository.create(testTag);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedTag) => {
    expect(savedTag.name).toBe(testTag.name);
    expect(savedTag.createdAt).toBeInstanceOf(Date);
    expect(savedTag.updatedAt).toBeInstanceOf(Date);
  });
});

test("既存タグを更新するとタグ情報が正常に更新されること", async () => {
  // 準備 - 最初のタグを作成
  const createData = createTestCreateTag();
  const createResult = await tagRepository.create(createData);

  let tagId = "";
  createResult.map((tag) => {
    tagId = tag.id;
  });

  // 更新用のタグ情報
  const updateData = createTestUpdateTag(tagId);

  // 実行
  const result = await tagRepository.update(updateData);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedTag) => {
    expect(savedTag.id).toBe(tagId);
    expect(savedTag.name).toBe(updateData.name);
    expect(savedTag.createdAt).toBeInstanceOf(Date);
    expect(savedTag.updatedAt).toBeInstanceOf(Date);
  });
});

test("存在するIDでタグを検索するとタグが取得できること", async () => {
  // 準備
  const createData = createTestCreateTag();
  const createResult = await tagRepository.create(createData);

  let tagId = "";
  createResult.map((tag) => {
    tagId = tag.id;
  });

  // 実行
  const result = await tagRepository.findById(tagId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((tag) => {
    expect(tag).not.toBeNull();
    if (tag) {
      expect(tag.id).toBe(tagId);
      expect(tag.name).toBe(createData.name);
      expect(tag.createdAt).toBeInstanceOf(Date);
      expect(tag.updatedAt).toBeInstanceOf(Date);
    }
  });
});

test("存在しないIDでタグを検索するとnullが返されること", async () => {
  // 準備
  const nonExistentId = uuidv7();

  // 実行
  const result = await tagRepository.findById(nonExistentId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((tag) => {
    expect(tag).toBeNull();
  });
});

test("指定したノートIDのタグ一覧を取得できること", async () => {
  // 準備 - 複数のタグを作成
  const tags = await Promise.all([
    tagRepository.create(createTestCreateTag()),
    tagRepository.create(createTestCreateTag()),
    tagRepository.create(createTestCreateTag()),
  ]);

  // タグとノートを関連付ける
  const db = getTestDatabase(client);
  const tagIds: string[] = [];

  // Result型からタグIDを取り出す
  for (const tagResult of tags) {
    tagResult.map((tag) => {
      tagIds.push(tag.id);
    });
  }

  // すべてのタグを関連付ける（Promise.allで待つ）
  await Promise.all(
    tagIds.map((tagId) =>
      db.insert(noteTags).values({
        noteId: testNoteId,
        tagId: tagId,
      }),
    ),
  );

  // 実行
  const result = await tagRepository.findByNoteId(testNoteId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((foundTags) => {
    expect(foundTags.length).toBe(tagIds.length);
    // 各タグがタグスキーマに準拠していることを確認
    for (const tag of foundTags) {
      expect(tag.id).toBeDefined();
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

test("タグを削除すると該当タグが削除されること", async () => {
  // 準備
  const createData = createTestCreateTag();
  const createResult = await tagRepository.create(createData);

  let tagId = "";
  createResult.map((tag) => {
    tagId = tag.id;
  });

  // 実行
  const deleteResult = await tagRepository.delete(tagId);

  // 検証
  expect(deleteResult.isOk()).toBe(true);

  // 削除されたことを確認
  const findResult = await tagRepository.findById(tagId);
  expect(findResult.isOk()).toBe(true);
  findResult.map((tag) => {
    expect(tag).toBeNull();
  });
});

test("バリデーションエラーとなるデータでタグを作成するとエラーが返されること", async () => {
  // 準備 - 不正なデータ（nameが空）
  const invalidTag = {
    name: "", // 空の名前
  };

  // 実行
  const result = await tagRepository.create(invalidTag as CreateTag);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.message).toContain("Failed to parse tag data");
  });
});

test("重複するタグ名で作成するとユニーク制約違反で失敗すること", async () => {
  // 準備 - 最初のタグを保存
  const tagName = `テストタグ-${Math.floor(Math.random() * 1000)}`;
  const firstTag = {
    name: tagName,
  };
  await tagRepository.create(firstTag);

  // 同じ名前で別のタグを作成
  const duplicateTag = {
    name: tagName,
  };

  // 実行
  const result = await tagRepository.create(duplicateTag);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.UNIQUE_VIOLATION);
  });
});

test("ノートタグ関連付けテーブルを介してノートとタグの関係が維持されること", async () => {
  // 準備 - タグを作成
  const createResult = await tagRepository.create(createTestCreateTag());
  let tagId = "";
  createResult.map((tag) => {
    tagId = tag.id;
  });

  // ノートとタグを関連付ける
  const db = getTestDatabase(client);
  await db.insert(noteTags).values({
    noteId: testNoteId,
    tagId: tagId,
  });

  // 実行 - ノートに関連付けられたタグを取得
  const findResult = await tagRepository.findByNoteId(testNoteId);

  // 検証
  expect(findResult.isOk()).toBe(true);
  findResult.map((tags) => {
    expect(tags.length).toBe(1);
    expect(tags[0].id).toBe(tagId);
  });

  // タグを削除した場合、関連付けも削除されることを確認
  await tagRepository.delete(tagId);

  // 再度ノートに関連付けられたタグを取得
  const afterDeleteResult = await tagRepository.findByNoteId(testNoteId);
  expect(afterDeleteResult.isOk()).toBe(true);
  afterDeleteResult.map((tags) => {
    expect(tags.length).toBe(0); // タグが削除されたので関連付けもなくなっている
  });
});
