import { NoteScope } from "@/domain/note/models/note";
import type { CreateOrUpdateNote } from "@/domain/note/repositories";
import { RepositoryErrorCode } from "@/domain/types/error";
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
import { books, noteTags, tags } from "../../../schema/note";
import { DrizzleBookRepository } from "../book-repository";
import { DrizzleNoteRepository } from "../note-repository";
import { DrizzleTagRepository } from "../tag-repository";

// テスト用のデータベース
let client: PGlite;
let noteRepository: DrizzleNoteRepository;
let bookRepository: DrizzleBookRepository;
let tagRepository: DrizzleTagRepository;
let db: ReturnType<typeof getTestDatabase>;

// テスト用のユーザーID
let testUserId: string;
let testBookId: string;

const generatePath = () => `test-path-${Math.floor(Math.random() * 1000)}.md`;

// テスト用のCreateNoteデータ
const createTestCreateNote = (
  bookId: string,
  path: string,
  tagNames: string[] = [],
): CreateOrUpdateNote => ({
  userId: testUserId,
  bookId,
  path,
  title: "テストノート",
  body: "# テストノート\n\nこれはテスト用のノートです。",
  scope: NoteScope.PUBLIC,
  tags: tagNames,
});

// テスト用のUpdateNoteデータ
const createTestUpdateNote = (
  bookId: string,
  path: string,
  tagNames: string[] = [],
): CreateOrUpdateNote => ({
  userId: testUserId,
  bookId,
  path,
  title: "更新されたノート",
  body: "# 更新されたノート\n\nこのノートは更新されました。",
  scope: NoteScope.PUBLIC,
  tags: tagNames,
});

beforeAll(async () => {
  client = new PGlite();
  await setupTestDatabase(client);
  db = getTestDatabase(client);
  noteRepository = new DrizzleNoteRepository(db);
  bookRepository = new DrizzleBookRepository(db);
  tagRepository = new DrizzleTagRepository(db);
});

beforeEach(async () => {
  await cleanupTestDatabase(client);

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
});

afterAll(async () => {
  await closeTestDatabase(client);
});

test("新規ノートを作成するとノートが正常に作成されること", async () => {
  // 準備
  const createData = createTestCreateNote(testBookId, generatePath());

  // 実行
  const result = await noteRepository.createOrUpdate(createData);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedNote) => {
    expect(savedNote.userId).toBe(testUserId);
    expect(savedNote.bookId).toBe(testBookId);
    expect(savedNote.path).toBe(createData.path);
    expect(savedNote.title).toBe(createData.title);
    expect(savedNote.body).toBe(createData.body);
    expect(savedNote.createdAt).toBeInstanceOf(Date);
    expect(savedNote.updatedAt).toBeInstanceOf(Date);
  });
});

test("タグ付きの新規ノートを作成するとノートとタグが正常に作成されること", async () => {
  // 準備
  const tagNames = [
    `タグ1-${Math.floor(Math.random() * 1000)}`,
    `タグ2-${Math.floor(Math.random() * 1000)}`,
  ];
  const createData = createTestCreateNote(testBookId, generatePath(), tagNames);

  // 実行
  const result = await noteRepository.createOrUpdate(createData);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedNote) => {
    expect(savedNote.userId).toBe(testUserId);
    expect(savedNote.bookId).toBe(testBookId);
    expect(savedNote.tags.length).toBe(tagNames.length);

    // タグの名前を検証
    const savedTagNames = savedNote.tags.map((tag) => tag.name);
    expect(savedTagNames).toContain(tagNames[0]);
    expect(savedTagNames).toContain(tagNames[1]);
  });
});

test("同じブックID、pathでノート情報が正常に更新されること", async () => {
  const path = generatePath();
  // 準備 - 最初のノートを作成
  const createData = createTestCreateNote(testBookId, path);
  const createResult = await noteRepository.createOrUpdate(createData);

  const noteId = createResult.map((note) => note.id).unwrapOr("");

  // 更新用のノート情報
  const updateData = createTestUpdateNote(testBookId, path);

  // 実行
  const result = await noteRepository.createOrUpdate(updateData);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedNote) => {
    expect(savedNote.id).toBe(noteId);
    expect(savedNote.title).toBe(updateData.title);
    expect(savedNote.body).toBe(updateData.body);
    expect(savedNote.createdAt).toBeInstanceOf(Date);
    expect(savedNote.updatedAt).toBeInstanceOf(Date);
  });
});

test("ノートのタグを更新するとタグ情報が正常に更新されること", async () => {
  const path = generatePath();
  // 準備 - 最初のノートを作成
  const initialTagNames = [`初期タグ-${Math.floor(Math.random() * 1000)}`];
  const createData = createTestCreateNote(testBookId, path, initialTagNames);
  await noteRepository.createOrUpdate(createData);

  // 更新用のタグ情報
  const updatedTagNames = [
    `更新タグ1-${Math.floor(Math.random() * 1000)}`,
    `更新タグ2-${Math.floor(Math.random() * 1000)}`,
  ];
  const updateData = createTestUpdateNote(testBookId, path, updatedTagNames);

  // 実行
  const result = await noteRepository.createOrUpdate(updateData);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedNote) => {
    expect(savedNote.tags.length).toBe(updatedTagNames.length);

    // タグの名前を検証
    const savedTagNames = savedNote.tags.map((tag) => tag.name);
    expect(savedTagNames).toContain(updatedTagNames[0]);
    expect(savedTagNames).toContain(updatedTagNames[1]);
    expect(savedTagNames).not.toContain(initialTagNames[0]);
  });
});

test("存在するIDでノートを検索するとノートが取得できること", async () => {
  // 準備
  const createData = createTestCreateNote(testBookId, generatePath());
  const createResult = await noteRepository.createOrUpdate(createData);

  const noteId = createResult.map((note) => note.id).unwrapOr("");

  // 実行
  const result = await noteRepository.findById(noteId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((note) => {
    expect(note.id).toBe(noteId);
    expect(note.title).toBe(createData.title);
    expect(note.body).toBe(createData.body);
  });
});

test("存在しないIDでノートを検索するとNOT_FOUNDエラーが返されること", async () => {
  // 準備
  const nonExistentId = uuidv7();

  // 実行
  const result = await noteRepository.findById(nonExistentId);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  });
});

test("指定したブックIDのノート一覧を取得できること", async () => {
  const path1 = generatePath();
  const path2 = generatePath();
  const path3 = generatePath();

  // 準備
  const note1 = createTestCreateNote(testBookId, path1);
  const note2 = createTestCreateNote(testBookId, path2);

  // 別のブック用のノート
  const otherBookId = uuidv7();
  await db.insert(books).values({
    id: otherBookId,
    userId: testUserId,
    owner: "otherOwner",
    repo: "otherRepo",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const otherNote = createTestCreateNote(otherBookId, path3);

  // ノートを保存
  await noteRepository.createOrUpdate(note1);
  await noteRepository.createOrUpdate(note2);
  await noteRepository.createOrUpdate(otherNote);

  // 実行
  const result = await noteRepository.findByBookId(testBookId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.items.length).toBe(2);
    expect(data.count).toBe(2);

    // すべてのノートが指定したブックIDに属していることを確認
    for (const note of data.items) {
      expect(note.bookId).toBe(testBookId);
    }
  });
});

test("指定したタグIDのノート一覧を取得できること", async () => {
  // 準備
  // タグを作成
  const tagName = `検索用タグ-${Math.floor(Math.random() * 1000)}`;
  const [savedTag] = await db
    .insert(tags)
    .values({
      id: uuidv7(),
      bookId: testBookId,
      name: tagName,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  const path1 = generatePath();
  const path2 = generatePath();
  const path3 = generatePath();

  // まずノートを作成
  const note1CreateData = createTestCreateNote(testBookId, path1);
  const note1Result = await noteRepository.createOrUpdate(note1CreateData);

  let note1Id = "";
  note1Result.map((n) => {
    note1Id = n.id;
  });

  // 2つ目のノートも作成
  const note2CreateData = createTestCreateNote(testBookId, path2);
  const note2Result = await noteRepository.createOrUpdate(note2CreateData);

  let note2Id = "";
  note2Result.map((n) => {
    note2Id = n.id;
  });

  // タグなしノートも作成
  const otherNoteData = createTestCreateNote(testBookId, path3);
  await noteRepository.createOrUpdate(otherNoteData);

  // 直接note_tagsテーブルにレコードを挿入して、タグとノートを関連付ける
  await db.insert(noteTags).values({
    noteId: note1Id,
    tagId: savedTag.id,
  });

  await db.insert(noteTags).values({
    noteId: note2Id,
    tagId: savedTag.id,
  });

  // 実行
  const result = await noteRepository.findByTag(testBookId, savedTag.id);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    // タグが関連付けられたノートが2つあることを確認
    expect(data.items.length).toBe(2);
    expect(data.count).toBe(2);

    // IDを抽出
    const noteIds = data.items.map((n) => n.id);

    // 作成したノートのIDが含まれていることを確認
    expect(noteIds).toContain(note1Id);
    expect(noteIds).toContain(note2Id);
  });
});

test("キーワードでノートを検索できること", async () => {
  // 準備
  const path1 = generatePath();
  const path2 = generatePath();
  const path3 = generatePath();
  const uniqueWord = `unique${Math.floor(Math.random() * 1000)}`;

  // 検索キーワードを含むノート
  const note1 = createTestCreateNote(testBookId, path1);
  note1.title = `タイトルに${uniqueWord}を含むノート`;

  const note2 = createTestCreateNote(testBookId, path2);
  note2.body = `# テスト\n\nこの本文には${uniqueWord}というキーワードが含まれています。`;

  // 検索キーワードを含まないノート
  const otherNote = createTestCreateNote(testBookId, path3);

  await noteRepository.createOrUpdate(note1);
  await noteRepository.createOrUpdate(note2);
  await noteRepository.createOrUpdate(otherNote);

  // 実行
  const result = await noteRepository.search(testBookId, uniqueWord);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.items.length).toBe(2);
    expect(data.count).toBe(2);

    // キーワードを含むノートが検索結果に含まれているか確認
    const titles = data.items.map((note) => note.title);
    const bodies = data.items.map((note) => note.body);

    expect(
      titles.some((title) => title.includes(uniqueWord)) ||
        bodies.some((body) => body.includes(uniqueWord)),
    ).toBe(true);
  });
});

test("ノートを削除すると該当ノートが削除されること", async () => {
  // 準備
  const createData = createTestCreateNote(testBookId, generatePath());
  const createResult = await noteRepository.createOrUpdate(createData);

  const noteId = createResult.map((note) => note.id).unwrapOr("");

  // 実行 - 削除
  const deleteResult = await noteRepository.delete(noteId);

  // 検証 - 削除成功
  expect(deleteResult.isOk()).toBe(true);

  // 実行 - 確認
  const findResult = await noteRepository.findById(noteId);

  // 検証 - 削除確認
  expect(findResult.isErr()).toBe(true);
  findResult.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  });
});

test("存在しないブックIDでノートを作成すると失敗すること", async () => {
  // 準備 - 存在しないブックID
  const nonExistentBookId = uuidv7();
  const createData = createTestCreateNote(nonExistentBookId, generatePath());

  // 実行
  const result = await noteRepository.createOrUpdate(createData);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.CONSTRAINT_VIOLATION);
  });
});
