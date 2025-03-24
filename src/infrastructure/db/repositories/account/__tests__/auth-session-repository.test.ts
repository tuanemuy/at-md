import { randomBytes } from "node:crypto";
import type { AuthSession } from "@/domain/account/models";
import type { CreateAuthSession } from "@/domain/account/repositories";
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
import { authSessions } from "../../../schema/account";
import { DrizzleAuthSessionRepository } from "../auth-session-repository";

// テスト用のデータベース
let client: PGlite;
let authSessionRepository: DrizzleAuthSessionRepository;

// ランダムな文字列生成関数
const generateId = (length = 16): string => {
  return randomBytes(length).toString("hex");
};

// テスト用のAuthSessionデータ
const createTestAuthSession = (): AuthSession => ({
  id: uuidv7(),
  key: generateId(16),
  session: JSON.stringify({ userId: uuidv7() }),
  createdAt: new Date(),
  updatedAt: new Date(),
});

// テスト用のCreateAuthSessionデータ
const createTestCreateAuthSession = (): CreateAuthSession => {
  const session = createTestAuthSession();
  return {
    key: session.key,
    session: session.session,
  };
};

// テストの前に一度だけDBをセットアップ
beforeAll(async () => {
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  authSessionRepository = new DrizzleAuthSessionRepository(db);
});

// 各テストの前にデータをクリーンアップ
beforeEach(async () => {
  await cleanupTestDatabase(client);
});

// テストの後にDBを閉じる
afterAll(async () => {
  await closeTestDatabase(client);
});

test("新規AuthSessionを作成するとセッションが正常に作成されること", async () => {
  // 準備
  const testSession = createTestCreateAuthSession();

  // 実行
  const result = await authSessionRepository.create(testSession);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedSession) => {
    expect(savedSession.key).toBe(testSession.key);
    expect(savedSession.session).toBe(testSession.session);
    expect(savedSession.createdAt).toBeInstanceOf(Date);
    expect(savedSession.updatedAt).toBeInstanceOf(Date);
  });
});

test("存在するキーでAuthSessionを検索するとセッションが取得できること", async () => {
  // 準備
  const testSession = createTestCreateAuthSession();
  await authSessionRepository.create(testSession);

  // 実行
  const result = await authSessionRepository.findByKey(testSession.key);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((session) => {
    expect(session).not.toBeNull();
    if (session) {
      expect(session.key).toBe(testSession.key);
      expect(session.session).toBe(testSession.session);
    }
  });
});

test("存在しないキーでAuthSessionを検索するとnullが返されること", async () => {
  // 準備
  const nonExistentKey = generateId(16);

  // 実行
  const result = await authSessionRepository.findByKey(nonExistentKey);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((session) => {
    expect(session).toBeNull();
  });
});

test("AuthSessionを削除すると該当セッションが削除されること", async () => {
  // 準備
  const testSession = createTestCreateAuthSession();
  await authSessionRepository.create(testSession);

  // 実行
  const deleteResult = await authSessionRepository.deleteByKey(testSession.key);

  // 検証
  expect(deleteResult.isOk()).toBe(true);

  // 削除されたことを確認
  const findResult = await authSessionRepository.findByKey(testSession.key);
  expect(findResult.isOk()).toBe(true);
  findResult.map((session) => {
    expect(session).toBeNull();
  });
});

test("重複するキーでAuthSessionを作成すると失敗すること", async () => {
  // 準備 - 最初のセッションを作成
  const testSession = createTestCreateAuthSession();
  await authSessionRepository.create(testSession);

  // 同じキーで別のセッションを作成
  const duplicateData = createTestCreateAuthSession();
  duplicateData.key = testSession.key;

  // 実行
  const result = await authSessionRepository.create(duplicateData);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.UNIQUE_VIOLATION);
  });
});
