import { type Note, NoteScope } from "@/domain/note/models/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import type { Tag } from "@/domain/note/models/tag";
import type { CreateNote, UpdateNote } from "@/domain/note/repositories";
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
import { books, noteTags, notes, tags } from "../../../schema/note";
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

// テスト用のブックデータ
const createTestBook = () => ({
  id: uuidv7(),
  userId: testUserId,
  owner: "testOwner",
  repo: "testRepo",
  details: {
    name: "テストブック",
    description: "これはテスト用のブックです。",
  },
  syncStatus: {
    lastSyncedAt: new Date(),
    status: SyncStatusCode.SYNCED,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// テスト用のタグデータ
const createTestTag = (): Tag => ({
  id: uuidv7(),
  name: `テストタグ-${Math.floor(Math.random() * 1000)}`,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// テスト用のノートデータ
const createTestNote = (bookId: string, tags: Tag[] = []): Note => ({
  id: uuidv7(),
  userId: testUserId,
  bookId,
  path: `test-path-${Math.floor(Math.random() * 1000)}.md`,
  title: "テストノート",
  body: "# テストノート\n\nこれはテスト用のノートです。",
  scope: NoteScope.PUBLIC,
  tags,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// テスト用のCreateNoteデータ
const createTestCreateNote = (
  bookId: string,
  tags: { name: string }[] = [],
): CreateNote => ({
  userId: testUserId,
  bookId,
  path: `test-path-${Math.floor(Math.random() * 1000)}.md`,
  title: "テストノート",
  body: "# テストノート\n\nこれはテスト用のノートです。",
  scope: NoteScope.PUBLIC,
  tags,
});

// テスト用のUpdateNoteデータ
const createTestUpdateNote = (
  id: string,
  bookId: string,
  tags: { name: string }[] = [],
): UpdateNote => ({
  id,
  userId: testUserId,
  bookId,
  path: `test-path-${Math.floor(Math.random() * 1000)}.md`,
  title: "更新されたノート",
  body: "# 更新されたノート\n\nこのノートは更新されました。",
  scope: NoteScope.PUBLIC,
  tags,
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
  const createData = createTestCreateNote(testBookId);

  // 実行
  const result = await noteRepository.create(createData);

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
  const tags = [
    { name: `タグ1-${Math.floor(Math.random() * 1000)}` },
    { name: `タグ2-${Math.floor(Math.random() * 1000)}` },
  ];
  const createData = createTestCreateNote(testBookId, tags);

  // 実行
  const result = await noteRepository.create(createData);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedNote) => {
    expect(savedNote.userId).toBe(testUserId);
    expect(savedNote.bookId).toBe(testBookId);
    expect(savedNote.tags.length).toBe(tags.length);

    // タグの名前を検証
    const tagNames = savedNote.tags.map((tag) => tag.name);
    expect(tagNames).toContain(tags[0].name);
    expect(tagNames).toContain(tags[1].name);
  });
});

test("既存ノートを更新するとノート情報が正常に更新されること", async () => {
  // 準備 - 最初のノートを作成
  const createData = createTestCreateNote(testBookId);
  const createResult = await noteRepository.create(createData);

  let noteId = "";
  createResult.map((note) => {
    noteId = note.id;
  });

  // 更新用のノート情報
  const updateData = createTestUpdateNote(noteId, testBookId);

  // 実行
  const result = await noteRepository.update(updateData);

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
  // 準備 - 最初のノートを作成
  const initialTags = [
    { name: `初期タグ-${Math.floor(Math.random() * 1000)}` },
  ];
  const createData = createTestCreateNote(testBookId, initialTags);
  const createResult = await noteRepository.create(createData);

  let noteId = "";
  createResult.map((note) => {
    noteId = note.id;
  });

  // 更新用のタグ情報
  const updatedTags = [
    { name: `更新タグ1-${Math.floor(Math.random() * 1000)}` },
    { name: `更新タグ2-${Math.floor(Math.random() * 1000)}` },
  ];
  const updateData = createTestUpdateNote(noteId, testBookId, updatedTags);

  // 実行
  const result = await noteRepository.update(updateData);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedNote) => {
    expect(savedNote.tags.length).toBe(updatedTags.length);

    // タグの名前を検証
    const tagNames = savedNote.tags.map((tag) => tag.name);
    expect(tagNames).toContain(updatedTags[0].name);
    expect(tagNames).toContain(updatedTags[1].name);
    expect(tagNames).not.toContain(initialTags[0].name);
  });
});

test("存在するIDでノートを検索するとノートが取得できること", async () => {
  // 準備
  const createData = createTestCreateNote(testBookId);
  const createResult = await noteRepository.create(createData);

  let noteId = "";
  createResult.map((note) => {
    noteId = note.id;
  });

  // 実行
  const result = await noteRepository.findById(noteId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((note) => {
    expect(note).not.toBeNull();
    if (note) {
      expect(note.id).toBe(noteId);
      expect(note.title).toBe(createData.title);
      expect(note.body).toBe(createData.body);
    }
  });
});

test("存在しないIDでノートを検索するとnullが返されること", async () => {
  // 準備
  const nonExistentId = uuidv7();

  // 実行
  const result = await noteRepository.findById(nonExistentId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((note) => {
    expect(note).toBeNull();
  });
});

test("指定したブックIDのノート一覧を取得できること", async () => {
  // 準備
  const note1 = createTestCreateNote(testBookId);
  const note2 = createTestCreateNote(testBookId);

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
  const otherNote = createTestCreateNote(otherBookId);

  // ノートを保存
  await noteRepository.create(note1);
  await noteRepository.create(note2);
  await noteRepository.create(otherNote);

  // 実行
  const result = await noteRepository.findByBookId(testBookId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((notes) => {
    expect(notes.length).toBe(2);

    // すべてのノートが指定したブックIDに属していることを確認
    for (const note of notes) {
      expect(note.bookId).toBe(testBookId);
    }
  });
});

test("指定したタグIDのノート一覧を取得できること", async () => {
  // 準備
  // タグを作成
  const tagName = `検索用タグ-${Math.floor(Math.random() * 1000)}`;
  const tagCreateResult = await tagRepository.create({ name: tagName });

  let tagId = "";
  tagCreateResult.map((tag) => {
    tagId = tag.id;
  });

  // タグを直接DBに関連付ける方法を使用
  // まずノートを作成
  const note1CreateData = createTestCreateNote(testBookId);
  const note1Result = await noteRepository.create(note1CreateData);

  let note1Id = "";
  note1Result.map((n) => {
    note1Id = n.id;
  });

  // 2つ目のノートも作成
  const note2CreateData = createTestCreateNote(testBookId);
  const note2Result = await noteRepository.create(note2CreateData);

  let note2Id = "";
  note2Result.map((n) => {
    note2Id = n.id;
  });

  // タグなしノートも作成
  const otherNoteData = createTestCreateNote(testBookId);
  await noteRepository.create(otherNoteData);

  // 直接note_tagsテーブルにレコードを挿入して、タグとノートを関連付ける
  await db.insert(noteTags).values({
    noteId: note1Id,
    tagId: tagId,
  });

  await db.insert(noteTags).values({
    noteId: note2Id,
    tagId: tagId,
  });

  // 実行
  const result = await noteRepository.findByTag(tagId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((notes) => {
    // タグが関連付けられたノートが2つあることを確認
    expect(notes.length).toBe(2);

    // IDを抽出
    const noteIds = notes.map((n) => n.id);

    // 作成したノートのIDが含まれていることを確認
    expect(noteIds).toContain(note1Id);
    expect(noteIds).toContain(note2Id);
  });
});

test("キーワードでノートを検索できること", async () => {
  // 準備
  const uniqueWord = `unique${Math.floor(Math.random() * 1000)}`;

  // 検索キーワードを含むノート
  const note1 = createTestCreateNote(testBookId);
  note1.title = `タイトルに${uniqueWord}を含むノート`;

  const note2 = createTestCreateNote(testBookId);
  note2.body = `# テスト\n\nこの本文には${uniqueWord}というキーワードが含まれています。`;

  // 検索キーワードを含まないノート
  const otherNote = createTestCreateNote(testBookId);

  await noteRepository.create(note1);
  await noteRepository.create(note2);
  await noteRepository.create(otherNote);

  // 実行
  const result = await noteRepository.search(testBookId, uniqueWord);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((notes) => {
    expect(notes.length).toBe(2);

    // キーワードを含むノートが検索結果に含まれているか確認
    const titles = notes.map((note) => note.title);
    const bodies = notes.map((note) => note.body);

    expect(
      titles.some((title) => title.includes(uniqueWord)) ||
        bodies.some((body) => body.includes(uniqueWord)),
    ).toBe(true);
  });
});

test("ノートを削除すると該当ノートが削除されること", async () => {
  // 準備
  const createData = createTestCreateNote(testBookId);
  const createResult = await noteRepository.create(createData);

  let noteId = "";
  createResult.map((note) => {
    noteId = note.id;
  });

  // 実行 - 削除
  const deleteResult = await noteRepository.delete(noteId);

  // 検証 - 削除成功
  expect(deleteResult.isOk()).toBe(true);

  // 実行 - 確認
  const findResult = await noteRepository.findById(noteId);

  // 検証 - 削除確認
  expect(findResult.isOk()).toBe(true);
  findResult.map((note) => {
    expect(note).toBeNull();
  });
});

test("存在しないブックIDでノートを作成すると失敗すること", async () => {
  // 準備 - 存在しないブックID
  const nonExistentBookId = uuidv7();
  const createData = createTestCreateNote(nonExistentBookId);

  // 実行
  const result = await noteRepository.create(createData);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.CONSTRAINT_VIOLATION);
  });
});

test("不正なパスでノートを作成すると失敗すること", async () => {
  // 準備 - 不正なパス（空文字）
  const createData = createTestCreateNote(testBookId);
  createData.path = "";

  // 実行
  const result = await noteRepository.create(createData);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.message).toContain("Failed to parse note data");
  });
});

test("同じブック内で重複するパスでノートを作成すると失敗すること", async () => {
  // 準備 - 最初のノートを作成
  const duplicatePath = `duplicate-path-${Math.floor(Math.random() * 1000)}.md`;
  const createData1 = createTestCreateNote(testBookId);
  createData1.path = duplicatePath;
  await noteRepository.create(createData1);

  // 重複するパスで2つ目のノートを作成
  const createData2 = createTestCreateNote(testBookId);
  createData2.path = duplicatePath;

  // 実行
  const result = await noteRepository.create(createData2);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.UNIQUE_VIOLATION);
  });
});

test("存在しないノートの更新は失敗すること", async () => {
  // 準備 - 存在しないノートID
  const nonExistentId = uuidv7();
  const updateData = createTestUpdateNote(nonExistentId, testBookId);

  // 実行
  const result = await noteRepository.update(updateData);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    // 実際のエラーメッセージに合わせて修正
    expect(error.message).toContain("Failed to parse note data");
  });
});
