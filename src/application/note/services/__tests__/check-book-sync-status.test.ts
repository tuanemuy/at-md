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
import {
  type RepositoryError,
  RepositoryErrorCode,
} from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { DrizzleBookRepository } from "@/infrastructure/db/repositories/note/book-repository";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test } from "vitest";
import { CheckBookSyncStatusService } from "../check-book-sync-status";

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

test("ブックが存在する場合に同期ステータスが返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // テスト用のブックを作成
  const owner = "owner1";
  const repo = "repo1";
  const lastSyncedAt = new Date();

  const createBookResult = await bookRepository.create({
    userId,
    owner,
    repo,
    details: {
      name: "repo1",
      description: "owner1/repo1",
    },
    syncStatus: {
      lastSyncedAt,
      status: SyncStatusCode.SYNCED,
    },
  });

  expect(createBookResult.isOk()).toBe(true);
  const bookId = createBookResult.isOk() ? createBookResult.value.id : "";

  // サービスのインスタンスを作成
  const service = new CheckBookSyncStatusService({
    deps: {
      bookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.status).toBe(SyncStatusCode.SYNCED);
    expect(result.value.lastSyncedAt?.getTime()).toBe(lastSyncedAt.getTime());
  }
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  // 存在しないブックID
  const nonExistingBookId = generateId("Book");

  // サービスのインスタンスを作成
  const service = new CheckBookSyncStatusService({
    deps: {
      bookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId: nonExistingBookId });

  // 検証
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect((result.error.cause as RepositoryError).code).toBe(
      RepositoryErrorCode.NOT_FOUND,
    );
  }
});
