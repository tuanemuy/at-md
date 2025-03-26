import { randomBytes } from "node:crypto";
import type { AuthState } from "@/domain/account/models";
import type { CreateAuthState } from "@/domain/account/repositories";
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
import { authStates } from "../../../schema/account";
import { DrizzleAuthStateRepository } from "../auth-state-repository";

// テスト用のデータベース
let client: PGlite;
let authStateRepository: DrizzleAuthStateRepository;

// ランダムな文字列生成関数
const generateId = (length = 16): string => {
  return randomBytes(length).toString("hex");
};

// テスト用のAuthStateデータ
const createTestAuthState = (): AuthState => ({
  id: uuidv7(),
  key: generateId(16),
  state: JSON.stringify({
    redirectUrl: "/dashboard",
    providerName: "bluesky",
    timestamp: Date.now(),
  }),
  createdAt: new Date(),
  updatedAt: new Date(),
});

// テスト用のCreateAuthStateデータ
const createTestCreateAuthState = (): CreateAuthState => {
  const state = createTestAuthState();
  return {
    key: state.key,
    state: state.state,
  };
};

// テストの前に一度だけDBをセットアップ
beforeAll(async () => {
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  authStateRepository = new DrizzleAuthStateRepository(db);
});

// 各テストの前にデータをクリーンアップ
beforeEach(async () => {
  await cleanupTestDatabase(client);
});

// テストの後にDBを閉じる
afterAll(async () => {
  await closeTestDatabase(client);
});

test("新規AuthStateを作成するとステートが正常に作成されること", async () => {
  // 準備
  const testState = createTestCreateAuthState();

  // 実行
  const result = await authStateRepository.create(testState);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedState) => {
    expect(savedState.key).toBe(testState.key);
    expect(savedState.state).toBe(testState.state);
    expect(savedState.createdAt).toBeInstanceOf(Date);
    expect(savedState.updatedAt).toBeInstanceOf(Date);
  });
});

test("既存のキーでAuthStateを作成すると情報が更新されること", async () => {
  // 準備 - 最初のステートを作成
  const testState = createTestCreateAuthState();
  await authStateRepository.create(testState);

  // 同じキーで新しいステートを作成
  const newState = createTestCreateAuthState();
  newState.key = testState.key;

  // 実行
  const result = await authStateRepository.create(newState);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedState) => {
    expect(savedState.key).toBe(newState.key);
    expect(savedState.state).toBe(newState.state);
  });
});

test("存在するキーでAuthStateを検索するとステートが取得できること", async () => {
  // 準備
  const testState = createTestCreateAuthState();
  await authStateRepository.create(testState);

  // 実行
  const result = await authStateRepository.findByKey(testState.key);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((state) => {
    expect(state.key).toBe(testState.key);
    expect(state.state).toBe(testState.state);
  });
});

test("存在しないキーでAuthStateを検索するとNOT_FOUNDエラーが返されること", async () => {
  // 準備
  const nonExistentKey = generateId(16);

  // 実行
  const result = await authStateRepository.findByKey(nonExistentKey);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  });
});

test("AuthStateを削除すると該当ステートが削除されること", async () => {
  // 準備
  const testState = createTestCreateAuthState();
  await authStateRepository.create(testState);

  // 実行
  const deleteResult = await authStateRepository.deleteByKey(testState.key);

  // 検証
  expect(deleteResult.isOk()).toBe(true);

  // 削除されたことを確認
  const findResult = await authStateRepository.findByKey(testState.key);
  expect(findResult.isErr()).toBe(true);
  findResult.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  });
});
