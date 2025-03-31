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
import { GetBookService } from "../get-book";

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

test("ブックが存在する場合にブック情報が返されること", async () => {
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

  // サービスのインスタンスを作成して実行
  const service = new GetBookService({
    deps: {
      bookRepository,
    },
  });

  // 実行
  const result = await service.execute({ bookId });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.id).toBe(bookId);
    expect(result.value.userId).toBe(userId);
    expect(result.value.owner).toBe(owner);
    expect(result.value.repo).toBe(repo);
    expect(result.value.details.name).toBe("テストブック");
    expect(result.value.details.description).toBe("テスト用のブックです");
    expect(result.value.syncStatus.status).toBe(SyncStatusCode.SYNCED);
  }
});

test("ブックが存在しない場合にエラーが返されること", async () => {
  // 存在しないブックID
  const nonExistingBookId = generateId("Book");

  const service = new GetBookService({
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
    expect(result.error.cause).toBeInstanceOf(RepositoryError);
    expect((result.error.cause as RepositoryError).code).toBe(
      RepositoryErrorCode.NOT_FOUND,
    );
  }
});
