import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { Profile } from "@/domain/account/models";
import type { Book } from "@/domain/note/models";
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
import { ListBooksService } from "../list-books";

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

test("ブック一覧が正常に取得された場合にブック一覧が返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // テスト用のブックを複数作成
  await bookRepository.create({
    userId,
    owner: "owner1",
    repo: "repo1",
    details: {
      name: "テストブック1",
      description: "テスト用のブック1です",
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
  });

  await bookRepository.create({
    userId,
    owner: "owner2",
    repo: "repo2",
    details: {
      name: "テストブック2",
      description: "テスト用のブック2です",
    },
    syncStatus: {
      lastSyncedAt: null,
      status: SyncStatusCode.SYNCED,
    },
  });

  // サービスのインスタンスを作成
  const service = new ListBooksService({
    deps: {
      bookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.length).toBe(2);

    // ブックの基本情報を確認
    const owners = result.value.map((book) => book.owner).sort();
    expect(owners).toEqual(["owner1", "owner2"]);

    const repos = result.value.map((book) => book.repo).sort();
    expect(repos).toEqual(["repo1", "repo2"]);

    // すべてのブックが同じユーザーIDを持っていることを確認
    for (const book of result.value) {
      expect(book.userId).toBe(userId);
    }
  }
});

test("ユーザーがブックを持っていない場合に空配列が返されること", async () => {
  // テスト用のユーザーを作成（ブックは作成しない）
  const user = await createTestUser();
  const userId = user.id;

  const service = new ListBooksService({
    deps: {
      bookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual([]);
    expect(result.value.length).toBe(0);
  }
});

test("存在しないユーザーIDでブック一覧を取得すると空配列が返されること", async () => {
  const nonExistingUserId = generateId("User");

  const service = new ListBooksService({
    deps: {
      bookRepository,
    },
  });

  // 実行
  const result = await service.execute({ userId: nonExistingUserId });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual([]);
    expect(result.value.length).toBe(0);
  }
});
