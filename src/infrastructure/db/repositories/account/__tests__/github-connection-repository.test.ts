import { expect, test, beforeEach, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { v7 as uuidv7 } from "uuid";
import type { GitHubConnection } from "@/domain/account/models";
import type {
  CreateGitHubConnection,
  UpdateGitHubConnection,
} from "@/domain/account/repositories";
import { DrizzleGitHubConnectionRepository } from "../github-connection-repository";
import { RepositoryErrorCode } from "@/domain/types/error";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
} from "../../../__test__/setup";
import { users } from "../../../schema/account";

// テスト用のデータベース
let client: PGlite;
let githubConnectionRepository: DrizzleGitHubConnectionRepository;

// テスト用のユーザーID
let testUserId: string;

// テスト用のGitHub連携情報データ
const createTestConnection = (
  userId: string = testUserId,
): GitHubConnection => ({
  id: uuidv7(),
  userId,
  accessToken: `gho_${uuidv7()}`,
  refreshToken: `ghr_${uuidv7()}`,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
  scope: "repo user",
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createTestCreateConnection = (
  userId: string = testUserId,
): CreateGitHubConnection => ({
  userId,
  accessToken: `gho_${uuidv7()}`,
  refreshToken: `ghr_${uuidv7()}`,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
  scope: "repo user", // 文字列に修正
});

const createTestUpdateConnection = (
  id: string,
  userId: string = testUserId,
): UpdateGitHubConnection => ({
  id,
  userId,
  accessToken: `gho_${uuidv7()}`,
  refreshToken: `ghr_${uuidv7()}`,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
  scope: "repo user notifications", // 文字列に修正
});

// テストの前に一度だけDBをセットアップ
beforeAll(async () => {
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  githubConnectionRepository = new DrizzleGitHubConnectionRepository(db);
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

test("新規GitHub連携情報を作成すると連携情報が正常に作成されること", async () => {
  // 準備
  const testConnection = createTestCreateConnection();

  // 実行
  const result = await githubConnectionRepository.create(testConnection);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedConnection) => {
    expect(savedConnection.userId).toBe(testConnection.userId);
    expect(savedConnection.accessToken).toBe(testConnection.accessToken);
    expect(savedConnection.refreshToken).toBe(testConnection.refreshToken);
    expect(savedConnection.expiresAt).toBeInstanceOf(Date);
    expect(savedConnection.scope).toEqual(testConnection.scope);
    expect(savedConnection.createdAt).toBeInstanceOf(Date);
    expect(savedConnection.updatedAt).toBeInstanceOf(Date);
  });
});

test("既存のGitHub連携情報を更新すると情報が正常に更新されること", async () => {
  // 準備 - 最初の連携情報を保存
  const createConnection = createTestCreateConnection();
  const createResult =
    await githubConnectionRepository.create(createConnection);
  expect(createResult.isOk()).toBe(true);

  // IDを取得
  let connectionId = "";
  createResult.map((connection) => {
    connectionId = connection.id;
  });

  // 更新用の連携情報
  const updateConnection: UpdateGitHubConnection = {
    id: connectionId,
    userId: testUserId,
    accessToken: `gho_${uuidv7()}`,
    refreshToken: `ghr_${uuidv7()}`,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48時間後
    scope: "repo user notifications",
  };

  // 実行
  const result = await githubConnectionRepository.update(updateConnection);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedConnection) => {
    expect(savedConnection.id).toBe(connectionId);
    expect(savedConnection.accessToken).toBe(updateConnection.accessToken);
    expect(savedConnection.refreshToken).toBe(updateConnection.refreshToken);
    expect(savedConnection.expiresAt).toBeInstanceOf(Date);
    expect(savedConnection.scope).toEqual(updateConnection.scope);
    expect(savedConnection.createdAt).toBeInstanceOf(Date);
    expect(savedConnection.updatedAt).toBeInstanceOf(Date);
  });
});

test("存在するIDでGitHub連携情報を検索すると連携情報が取得できること", async () => {
  // 準備
  const createConnection = createTestCreateConnection();
  const createResult =
    await githubConnectionRepository.create(createConnection);
  expect(createResult.isOk()).toBe(true);

  let connectionId = "";
  createResult.map((connection) => {
    connectionId = connection.id;
  });

  // 実行
  const result = await githubConnectionRepository.findById(connectionId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((connection) => {
    expect(connection).not.toBeNull();
    if (connection) {
      expect(connection.id).toBe(connectionId);
      expect(connection.userId).toBe(createConnection.userId);
      expect(connection.accessToken).toBe(createConnection.accessToken);
      expect(connection.scope).toEqual(createConnection.scope);
    }
  });
});

test("存在しないIDでGitHub連携情報を検索するとnullが返されること", async () => {
  // 準備
  const nonExistentId = uuidv7();

  // 実行
  const result = await githubConnectionRepository.findById(nonExistentId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((connection) => {
    expect(connection).toBeNull();
  });
});

test("ユーザーIDで複数のGitHub連携情報を検索すると該当する連携情報一覧が取得できること", async () => {
  // 準備 - 複数の連携情報を保存
  const connection1 = createTestCreateConnection();
  const connection2 = createTestCreateConnection();

  const createResult1 = await githubConnectionRepository.create(connection1);
  const createResult2 = await githubConnectionRepository.create(connection2);

  // 実行
  const result = await githubConnectionRepository.findByUserId(testUserId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((connections) => {
    expect(connections.length).toBe(2);

    for (const connection of connections) {
      expect(connection.userId).toBe(testUserId);
    }
  });
});

test("存在しないユーザーIDでGitHub連携情報を検索すると空配列が返されること", async () => {
  // 準備
  const nonExistentUserId = uuidv7();

  // 実行
  const result =
    await githubConnectionRepository.findByUserId(nonExistentUserId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((connections) => {
    expect(connections).toEqual([]);
  });
});

test("GitHub連携情報を削除すると該当連携情報が削除されること", async () => {
  // 準備
  const createConnection = createTestCreateConnection();
  const createResult =
    await githubConnectionRepository.create(createConnection);
  expect(createResult.isOk()).toBe(true);

  let connectionId = "";
  createResult.map((connection) => {
    connectionId = connection.id;
  });

  // 実行
  const deleteResult = await githubConnectionRepository.delete(connectionId);

  // 検証
  expect(deleteResult.isOk()).toBe(true);

  // 削除されたことを確認
  const findResult = await githubConnectionRepository.findById(connectionId);
  expect(findResult.isOk()).toBe(true);
  findResult.map((connection) => {
    expect(connection).toBeNull();
  });
});

test("存在しないユーザーIDでGitHub連携情報を作成すると失敗すること", async () => {
  // 準備 - 存在しないユーザーIDで連携情報を作成
  const nonExistentUserId = uuidv7();
  const testConnection = createTestCreateConnection(nonExistentUserId);

  // 実行
  const result = await githubConnectionRepository.create(testConnection);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.CONSTRAINT_VIOLATION);
  });
});
