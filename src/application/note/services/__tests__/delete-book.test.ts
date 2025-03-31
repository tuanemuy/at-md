import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { Profile } from "@/domain/account/models";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { DrizzleBookRepository } from "@/infrastructure/db/repositories/note/book-repository";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test } from "vitest";
import { DeleteBookService } from "../delete-book";

// データベース関連の変数
let client: PGlite;
let userRepository: DrizzleUserRepository;
let bookRepository: DrizzleBookRepository;

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  userRepository = new DrizzleUserRepository(db);
  bookRepository = new DrizzleBookRepository(db);
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

test("ブックの所有者が削除した場合に成功すること", async () => {
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
      name: "repo1",
      description: "owner1/repo1",
    },
    syncStatus: {
      lastSyncedAt: new Date(),
      status: SyncStatusCode.SYNCED,
    },
  });

  expect(createBookResult.isOk()).toBe(true);
  const bookId = createBookResult.isOk() ? createBookResult.value.id : "";

  // サービスのインスタンスを作成
  const service = new DeleteBookService({
    deps: {
      bookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, bookId });

  // 検証
  expect(result.isOk()).toBe(true);

  // ブックが実際に削除されているか確認
  const findResult = await bookRepository.findById(bookId);
  expect(findResult.isErr()).toBe(true);
  if (findResult.isErr()) {
    expect(findResult.error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  }
});

test("存在しないブックIDを指定した場合でもエラーが返されないこと", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // 存在しないブックID
  const nonExistingBookId = generateId("Book");

  // サービスのインスタンスを作成
  const service = new DeleteBookService({
    deps: {
      bookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId, bookId: nonExistingBookId });

  // 検証：ブックが存在しなくても成功とみなす
  expect(result.isOk()).toBe(true);
});

test("所有者でないユーザーが削除しようとした場合は何も削除されないこと", async () => {
  // 2人のテストユーザーを作成
  const owner = await createTestUser();
  const ownerId = owner.id;

  const otherUser = await createTestUser();
  const otherUserId = otherUser.id;

  // 1人目のユーザーのブックを作成
  const repoOwner = "owner1";
  const repoName = "repo1";
  const createBookResult = await bookRepository.create({
    userId: ownerId,
    owner: repoOwner,
    repo: repoName,
    details: {
      name: "repo1",
      description: "owner1/repo1",
    },
    syncStatus: {
      lastSyncedAt: new Date(),
      status: SyncStatusCode.SYNCED,
    },
  });

  expect(createBookResult.isOk()).toBe(true);
  const bookId = createBookResult.isOk() ? createBookResult.value.id : "";

  // 2人目のユーザーでブックを削除しようとする
  const service = new DeleteBookService({
    deps: {
      bookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId: otherUserId, bookId });

  // 検証：何も削除されないこと (deleteは成功するがレコードは残る)
  expect(result.isOk()).toBe(true);

  // ブックが削除されていないか確認
  const findResult = await bookRepository.findById(bookId);
  expect(findResult.isOk()).toBe(true);
});
