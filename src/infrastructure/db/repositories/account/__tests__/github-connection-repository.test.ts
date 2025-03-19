import { expect, test, beforeAll, afterAll, beforeEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { v7 as uuidv7 } from "uuid";
import type { GitHubConnection } from "@/domain/account/models";
import { DrizzleGitHubConnectionRepository } from "../github-connection-repository";
import { DrizzleUserRepository } from "../user-repository";
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeTestDatabase,
  getTestDatabase
} from "../../../__test__/setup";

// テスト用のデータベース
let client: PGlite;
let connectionRepository: DrizzleGitHubConnectionRepository;
let userRepository: DrizzleUserRepository;

// テスト用のユーザーID
let testUserId: string;

// テスト用のGitHub連携情報データ
const createTestConnection = (userId: string): GitHubConnection => ({
  id: uuidv7(),
  userId,
  accessToken: `gho_test_access_token_${uuidv7()}`,
  refreshToken: `ghr_test_refresh_token_${uuidv7()}`,
  expiresAt: new Date(Date.now() + 3600 * 1000), // 1時間後
  scope: ["repo", "user"],
  createdAt: new Date(),
  updatedAt: new Date()
});

// テストの前に一度だけDBをセットアップ
beforeAll(async () => {
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  connectionRepository = new DrizzleGitHubConnectionRepository(db);
  userRepository = new DrizzleUserRepository(db);
  
  // テスト用ユーザーを作成
  const result = await userRepository.save({
    id: uuidv7(),
    did: `did:plc:${uuidv7()}`,
    profile: {
      displayName: "テストユーザー",
      description: "これはテスト用のユーザーです。",
      avatarUrl: null,
      bannerUrl: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  result.map((user) => {
    testUserId = user.id;
  });
});

// 各テストの前にデータをクリーンアップ
beforeEach(async () => {
  await cleanupTestDatabase(client);
  
  // テスト用ユーザーを再作成
  const result = await userRepository.save({
    id: testUserId,
    did: `did:plc:${uuidv7()}`,
    profile: {
      displayName: "テストユーザー",
      description: "これはテスト用のユーザーです。",
      avatarUrl: null,
      bannerUrl: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
});

// テストの後にDBを閉じる
afterAll(async () => {
  await closeTestDatabase(client);
});

test("新規GitHub連携情報を保存すると連携情報が正常に作成されること", async () => {
  // 準備
  const testConnection = createTestConnection(testUserId);
  
  // 実行
  const result = await connectionRepository.save(testConnection);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedConnection) => {
    expect(savedConnection.id).toBe(testConnection.id);
    expect(savedConnection.userId).toBe(testConnection.userId);
    expect(savedConnection.accessToken).toBe(testConnection.accessToken);
    expect(savedConnection.refreshToken).toBe(testConnection.refreshToken);
    expect(savedConnection.expiresAt).toBeInstanceOf(Date);
    expect(savedConnection.scope).toEqual(expect.arrayContaining(testConnection.scope));
    expect(savedConnection.createdAt).toBeInstanceOf(Date);
    expect(savedConnection.updatedAt).toBeInstanceOf(Date);
  });
});

test("既存のGitHub連携情報を更新すると情報が正常に更新されること", async () => {
  // 準備 - 最初の連携情報を保存
  const testConnection = createTestConnection(testUserId);
  await connectionRepository.save(testConnection);
  
  // 更新用の連携情報
  const updatedConnection: GitHubConnection = {
    ...testConnection,
    accessToken: `gho_updated_access_token_${uuidv7()}`,
    refreshToken: `ghr_updated_refresh_token_${uuidv7()}`,
    scope: ["repo", "user", "admin:org"],
    updatedAt: new Date()
  };
  
  // 実行
  const result = await connectionRepository.save(updatedConnection);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedConnection) => {
    expect(savedConnection.id).toBe(testConnection.id);
    expect(savedConnection.userId).toBe(testConnection.userId);
    expect(savedConnection.accessToken).toBe(updatedConnection.accessToken);
    expect(savedConnection.refreshToken).toBe(updatedConnection.refreshToken);
    expect(savedConnection.scope).toEqual(expect.arrayContaining(updatedConnection.scope));
    expect(savedConnection.scope.length).toBe(updatedConnection.scope.length);
    expect(savedConnection.createdAt).toBeInstanceOf(Date);
    expect(savedConnection.updatedAt).toBeInstanceOf(Date);
  });
});

test("存在するIDでGitHub連携情報を検索すると連携情報が取得できること", async () => {
  // 準備
  const testConnection = createTestConnection(testUserId);
  await connectionRepository.save(testConnection);
  
  // 実行
  const result = await connectionRepository.findById(testConnection.id);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((connection) => {
    expect(connection).not.toBeNull();
    if (connection) {
      expect(connection.id).toBe(testConnection.id);
      expect(connection.userId).toBe(testConnection.userId);
      expect(connection.accessToken).toBe(testConnection.accessToken);
      expect(connection.scope).toEqual(expect.arrayContaining(testConnection.scope));
    }
  });
});

test("存在しないIDでGitHub連携情報を検索するとnullが返されること", async () => {
  // 準備
  const nonExistentId = uuidv7();
  
  // 実行
  const result = await connectionRepository.findById(nonExistentId);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((connection) => {
    expect(connection).toBeNull();
  });
});

test("ユーザーIDで複数のGitHub連携情報を検索すると該当する連携情報一覧が取得できること", async () => {
  // 準備 - 複数の連携情報を保存
  const testConnection1 = createTestConnection(testUserId);
  const testConnection2 = createTestConnection(testUserId);
  await connectionRepository.save(testConnection1);
  await connectionRepository.save(testConnection2);
  
  // 実行
  const result = await connectionRepository.findByUserId(testUserId);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((connections) => {
    expect(connections.length).toBe(2);
    
    // ID順にソートして比較
    const sortedConnections = [...connections].sort((a, b) => a.id.localeCompare(b.id));
    const sortedTestConnections = [testConnection1, testConnection2].sort((a, b) => 
      a.id.localeCompare(b.id)
    );
    
    expect(sortedConnections[0].id).toBe(sortedTestConnections[0].id);
    expect(sortedConnections[1].id).toBe(sortedTestConnections[1].id);
  });
});

test("存在しないユーザーIDでGitHub連携情報を検索すると空配列が返されること", async () => {
  // 準備
  const nonExistentUserId = uuidv7();
  
  // 実行
  const result = await connectionRepository.findByUserId(nonExistentUserId);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((connections) => {
    expect(connections).toEqual([]);
  });
});

test("GitHub連携情報を削除すると該当連携情報が削除されること", async () => {
  // 準備
  const testConnection = createTestConnection(testUserId);
  await connectionRepository.save(testConnection);
  
  // 実行 - 削除
  const deleteResult = await connectionRepository.delete(testConnection.id);
  
  // 検証 - 削除成功
  expect(deleteResult.isOk()).toBe(true);
  
  // 実行 - 確認
  const findResult = await connectionRepository.findById(testConnection.id);
  
  // 検証 - 削除確認
  expect(findResult.isOk()).toBe(true);
  findResult.map((connection) => {
    expect(connection).toBeNull();
  });
}); 
