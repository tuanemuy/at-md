import type { Book } from "@/domain/note/models";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import type { CreateBook, UpdateBook } from "@/domain/note/repositories";
import { RepositoryErrorCode } from "@/domain/types/error";
import { users } from "../../../schema/account";
import { PGlite } from "@electric-sql/pglite";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "../../../__test__/setup";
import { DrizzleBookRepository } from "../book-repository";

// テスト用のデータベース
let client: PGlite;
let bookRepository: DrizzleBookRepository;
let testUserId: string;

// テスト用のブックデータを作成する関数
const createTestBook = (userId?: string): Book => ({
  id: uuidv7(),
  userId: userId || testUserId,
  owner: `owner-${Math.floor(Math.random() * 1000)}`,
  repo: `repo-${Math.floor(Math.random() * 1000)}`,
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

// テスト用のCreateBookデータを作成する関数
const createTestCreateBook = (userId?: string): CreateBook => {
  const book = createTestBook(userId);
  return {
    userId: book.userId,
    owner: book.owner,
    repo: book.repo,
    details: book.details,
    syncStatus: book.syncStatus,
  };
};

// テスト用のUpdateBookデータを作成する関数
const createTestUpdateBook = (id: string, userId?: string): UpdateBook => {
  const book = createTestBook(userId);
  return {
    id,
    userId: book.userId,
    owner: book.owner,
    repo: book.repo,
    details: {
      name: "更新されたブック名",
      description: "更新された説明文",
    },
    syncStatus: {
      lastSyncedAt: new Date(),
      status: SyncStatusCode.SYNCED,
    },
  };
};

// テストの前に一度だけDBをセットアップ
beforeAll(async () => {
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  bookRepository = new DrizzleBookRepository(db);
});

// 各テストの前にデータをクリーンアップし、テスト用ユーザーを作成
beforeEach(async () => {
  await cleanupTestDatabase(client);

  // テスト用ユーザーを作成
  const db = getTestDatabase(client);
  testUserId = uuidv7();
  await db.insert(users).values({
    id: testUserId,
    did: `did:example:${testUserId}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

// テストの後にDBを閉じる
afterAll(async () => {
  await closeTestDatabase(client);
});

test("新規ブックを保存するとブックが正常に作成されること", async () => {
  // 準備
  const testBook = createTestCreateBook();

  // 実行
  const result = await bookRepository.create(testBook);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedBook) => {
    expect(savedBook.userId).toBe(testBook.userId);
    expect(savedBook.owner).toBe(testBook.owner);
    expect(savedBook.repo).toBe(testBook.repo);
    expect(savedBook.details).toEqual(testBook.details);
    expect(savedBook.syncStatus.status).toBe(testBook.syncStatus.status);
    expect(savedBook.createdAt).toBeInstanceOf(Date);
    expect(savedBook.updatedAt).toBeInstanceOf(Date);
  });
});

test("既存ブックを更新するとブック情報が正常に更新されること", async () => {
  // 準備 - 最初のブックを保存
  const createData = createTestCreateBook();
  const createResult = await bookRepository.create(createData);
  expect(createResult.isOk()).toBe(true);

  let bookId = "";
  createResult.map((book) => {
    bookId = book.id;
  });

  // 更新用のブック情報
  const updateData = createTestUpdateBook(bookId);

  // 実行
  const result = await bookRepository.update(updateData);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedBook) => {
    expect(savedBook.id).toBe(bookId);
    expect(savedBook.details.name).toBe(updateData.details.name);
    expect(savedBook.details.description).toBe(updateData.details.description);
    expect(savedBook.createdAt).toBeInstanceOf(Date);
    expect(savedBook.updatedAt).toBeInstanceOf(Date);
  });
});

test("存在するIDでブックを検索するとブックが取得できること", async () => {
  // 準備
  const createData = createTestCreateBook();
  const createResult = await bookRepository.create(createData);
  expect(createResult.isOk()).toBe(true);

  let bookId = "";
  createResult.map((book) => {
    bookId = book.id;
  });

  // 実行
  const result = await bookRepository.findById(bookId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((book) => {
    expect(book).not.toBeNull();
    if (book) {
      expect(book.id).toBe(bookId);
      expect(book.userId).toBe(createData.userId);
      expect(book.owner).toBe(createData.owner);
      expect(book.repo).toBe(createData.repo);
      expect(book.details).toEqual(createData.details);
    }
  });
});

test("存在しないIDでブックを検索するとnullが返されること", async () => {
  // 準備
  const nonExistentId = uuidv7();

  // 実行
  const result = await bookRepository.findById(nonExistentId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((book) => {
    expect(book).toBeNull();
  });
});

test("指定したユーザーIDのブック一覧を取得できること", async () => {
  // 準備 - 複数のブックを作成
  const testBooks = [
    createTestCreateBook(),
    createTestCreateBook(),
    createTestCreateBook(),
  ];

  // 別のユーザーのブック
  const otherUserId = uuidv7();
  await getTestDatabase(client)
    .insert(users)
    .values({
      id: otherUserId,
      did: `did:example:${otherUserId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  const otherUserBook = createTestCreateBook(otherUserId);

  // すべてのブックを保存
  for (const book of [...testBooks, otherUserBook]) {
    await bookRepository.create(book);
  }

  // 実行
  const result = await bookRepository.findByUserId(testUserId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((books) => {
    expect(books.length).toBe(testBooks.length);
    for (const book of books) {
      expect(book.userId).toBe(testUserId);
    }
  });
});

test("指定したオーナーとリポジトリ名のブックを取得できること", async () => {
  // 準備
  const createData = createTestCreateBook();
  const createResult = await bookRepository.create(createData);
  expect(createResult.isOk()).toBe(true);

  await bookRepository.create(createTestCreateBook()); // 別のブック

  // 実行
  const result = await bookRepository.findByOwnerAndRepo(
    createData.owner,
    createData.repo,
  );

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((book) => {
    expect(book).not.toBeNull();
    if (book) {
      expect(book.owner).toBe(createData.owner);
      expect(book.repo).toBe(createData.repo);
    }
  });
});

test("ブックを削除すると該当ブックが削除されること", async () => {
  // 準備
  const createData = createTestCreateBook();
  const createResult = await bookRepository.create(createData);
  expect(createResult.isOk()).toBe(true);

  let bookId = "";
  createResult.map((book) => {
    bookId = book.id;
  });

  // 実行
  const deleteResult = await bookRepository.delete(bookId);

  // 検証
  expect(deleteResult.isOk()).toBe(true);

  // 削除されたことを確認
  const findResult = await bookRepository.findById(bookId);
  expect(findResult.isOk()).toBe(true);
  findResult.map((book) => {
    expect(book).toBeNull();
  });
});

test("存在しないユーザーIDでブックを作成すると外部キー制約違反で失敗すること", async () => {
  // 準備 - 存在しないユーザーID
  const nonExistentUserId = uuidv7();
  const testBook = createTestCreateBook(nonExistentUserId);

  // 実行
  const result = await bookRepository.create(testBook);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.CONSTRAINT_VIOLATION);
  });
});

test("重複するオーナー/リポジトリの組み合わせで作成するとユニーク制約違反で失敗すること", async () => {
  // 準備 - 最初のブックを保存
  const createData = createTestCreateBook();
  await bookRepository.create(createData);

  // 同じオーナー/リポジトリで別のブックを作成
  const duplicateBook = createTestCreateBook();
  duplicateBook.owner = createData.owner;
  duplicateBook.repo = createData.repo;

  // 実行
  const result = await bookRepository.create(duplicateBook);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.UNIQUE_VIOLATION);
  });
});
