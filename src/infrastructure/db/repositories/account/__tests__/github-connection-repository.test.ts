import type { GitHubConnection } from "@/domain/account/models";
import type {
  CreateGitHubConnection,
  UpdateGitHubConnection,
} from "@/domain/account/repositories";
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
import { DrizzleGitHubConnectionRepository } from "../github-connection-repository";

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
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createTestCreateConnection = (
  userId: string = testUserId,
): CreateGitHubConnection => ({
  userId,
  accessToken: `gho_${uuidv7()}`,
  refreshToken: `ghr_${uuidv7()}`,
});

const createTestUpdateConnection = (
  id: string,
  userId: string = testUserId,
): UpdateGitHubConnection => ({
  id,
  userId,
  accessToken: `gho_${uuidv7()}`,
  refreshToken: `ghr_${uuidv7()}`,
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
    expect(savedConnection.createdAt).toBeInstanceOf(Date);
    expect(savedConnection.updatedAt).toBeInstanceOf(Date);
  });
});

test("既存のユーザーIDでGitHub連携情報を作成すると情報が更新されること", async () => {
  // 準備 - 最初の連携情報を作成
  const createConnection = createTestCreateConnection();
  const createResult =
    await githubConnectionRepository.create(createConnection);
  expect(createResult.isOk()).toBe(true);

  // 同じユーザーIDで新しい連携情報を作成
  const newConnection = createTestCreateConnection(createConnection.userId);

  // 実行
  const result = await githubConnectionRepository.create(newConnection);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedConnection) => {
    expect(savedConnection.userId).toBe(newConnection.userId);
    expect(savedConnection.accessToken).toBe(newConnection.accessToken);
    expect(savedConnection.refreshToken).toBe(newConnection.refreshToken);
  });
});

test("refreshTokenがnullの新規GitHub連携情報を作成できること", async () => {
  // 準備
  const testConnection = createTestCreateConnection();
  testConnection.refreshToken = null;

  // 実行
  const result = await githubConnectionRepository.create(testConnection);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedConnection) => {
    expect(savedConnection.userId).toBe(testConnection.userId);
    expect(savedConnection.accessToken).toBe(testConnection.accessToken);
    expect(savedConnection.refreshToken).toBeNull();
  });
});

test("既存のGitHub連携情報を更新すると情報が正常に更新されること", async () => {
  // 準備 - 最初の連携情報を作成
  const createConnection = createTestCreateConnection();
  const createResult =
    await githubConnectionRepository.create(createConnection);

  let connectionId = "";
  createResult.map((connection) => {
    connectionId = connection.id;
  });

  // 更新用の連携情報
  const updateConnection = createTestUpdateConnection(connectionId);

  // 実行
  const result = await githubConnectionRepository.update(updateConnection);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedConnection) => {
    expect(savedConnection.id).toBe(connectionId);
    expect(savedConnection.accessToken).toBe(updateConnection.accessToken);
    expect(savedConnection.refreshToken).toBe(updateConnection.refreshToken);
    expect(savedConnection.createdAt).toBeInstanceOf(Date);
    expect(savedConnection.updatedAt).toBeInstanceOf(Date);
  });
});

test("存在するIDでGitHub連携情報を検索すると連携情報が取得できること", async () => {
  // 準備
  const createConnection = createTestCreateConnection();
  const createResult =
    await githubConnectionRepository.create(createConnection);

  let connectionId = "";
  createResult.map((connection) => {
    connectionId = connection.id;
  });

  // 実行
  const result = await githubConnectionRepository.findById(connectionId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((connection) => {
    expect(connection.id).toBe(connectionId);
    expect(connection.userId).toBe(createConnection.userId);
    expect(connection.accessToken).toBe(createConnection.accessToken);
  });
});

test("存在しないIDでGitHub連携情報を検索するとNOT_FOUNDエラーが返されること", async () => {
  // 準備
  const nonExistentId = uuidv7();

  // 実行
  const result = await githubConnectionRepository.findById(nonExistentId);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  });
});

test("存在するユーザーIDでGitHub連携情報を検索すると連携情報が取得できること", async () => {
  // 準備
  const createConnection = createTestCreateConnection();
  await githubConnectionRepository.create(createConnection);

  // 実行
  const result = await githubConnectionRepository.findByUserId(
    createConnection.userId,
  );

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((connection) => {
    expect(connection.userId).toBe(createConnection.userId);
    expect(connection.accessToken).toBe(createConnection.accessToken);
  });
});

test("存在しないユーザーIDでGitHub連携情報を検索するとNOT_FOUNDエラーが返されること", async () => {
  // 準備
  const nonExistentUserId = uuidv7();

  // 実行
  const result =
    await githubConnectionRepository.findByUserId(nonExistentUserId);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  });
});

test("GitHub連携情報を削除すると該当連携情報が削除されること", async () => {
  // 準備
  const createConnection = createTestCreateConnection();
  const createResult =
    await githubConnectionRepository.create(createConnection);

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
  expect(findResult.isErr()).toBe(true);
  findResult.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  });
});

test("ユーザーIDに紐づくGitHub連携情報を削除すると該当連携情報が削除されること", async () => {
  // 準備
  const createConnection = createTestCreateConnection();
  await githubConnectionRepository.create(createConnection);

  // 実行
  const deleteResult = await githubConnectionRepository.deleteByUserId(
    createConnection.userId,
  );

  // 検証
  expect(deleteResult.isOk()).toBe(true);

  // 削除されたことを確認
  const findResult = await githubConnectionRepository.findByUserId(
    createConnection.userId,
  );
  expect(findResult.isErr()).toBe(true);
  findResult.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
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
