import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { v7 as uuidv7 } from "uuid";
import { type User, Profile } from "@/domain/account/models";
import { DrizzleUserRepository } from "../user-repository";
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeTestDatabase,
  getTestDatabase
} from "../../../__test__/setup";

// テスト用のデータベース
let client: PGlite;
let userRepository: DrizzleUserRepository;

// テスト用のユーザーデータ
const createTestUser = (): User => ({
  id: uuidv7(),
  did: `did:plc:${uuidv7()}`,
  profile: {
    displayName: "テストユーザー",
    description: "これはテスト用のユーザーです。",
    avatarUrl: "https://example.com/avatar.png",
    bannerUrl: null
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// テストの前に一度だけDBをセットアップ
beforeAll(async () => {
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  userRepository = new DrizzleUserRepository(db);
});

// 各テストの前にデータをクリーンアップ
beforeEach(async () => {
  await cleanupTestDatabase(client);
});

// テストの後にDBを閉じる
afterAll(async () => {
  await closeTestDatabase(client);
});

test("新規ユーザーを保存するとユーザーが正常に作成されること", async () => {
  // 準備
  const testUser = createTestUser();
  
  // 実行
  const result = await userRepository.save(testUser);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedUser) => {
    expect(savedUser.id).toBe(testUser.id);
    expect(savedUser.did).toBe(testUser.did);
    expect(savedUser.profile.displayName).toBe(testUser.profile.displayName);
    expect(savedUser.profile.description).toBe(testUser.profile.description);
    expect(savedUser.profile.avatarUrl).toBe(testUser.profile.avatarUrl);
    expect(savedUser.profile.bannerUrl).toBe(testUser.profile.bannerUrl);
    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.updatedAt).toBeInstanceOf(Date);
  });
});

test("既存ユーザーを更新するとユーザー情報が正常に更新されること", async () => {
  // 準備 - 最初のユーザーを保存
  const testUser = createTestUser();
  await userRepository.save(testUser);
  
  // 更新用のユーザー情報
  const updatedUser: User = {
    ...testUser,
    profile: {
      ...testUser.profile,
      displayName: "更新されたユーザー名",
      description: "更新された説明文"
    },
    updatedAt: new Date()
  };
  
  // 実行
  const result = await userRepository.save(updatedUser);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedUser) => {
    expect(savedUser.id).toBe(testUser.id);
    expect(savedUser.did).toBe(testUser.did);
    expect(savedUser.profile.displayName).toBe(updatedUser.profile.displayName);
    expect(savedUser.profile.description).toBe(updatedUser.profile.description);
    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.updatedAt).toBeInstanceOf(Date);
  });
});

test("存在するIDでユーザーを検索するとユーザーが取得できること", async () => {
  // 準備
  const testUser = createTestUser();
  await userRepository.save(testUser);
  
  // 実行
  const result = await userRepository.findById(testUser.id);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((user) => {
    expect(user).not.toBeNull();
    if (user) {
      expect(user.id).toBe(testUser.id);
      expect(user.did).toBe(testUser.did);
      expect(user.profile.displayName).toBe(testUser.profile.displayName);
    }
  });
});

test("存在しないIDでユーザーを検索するとnullが返されること", async () => {
  // 準備
  const nonExistentId = uuidv7();
  
  // 実行
  const result = await userRepository.findById(nonExistentId);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((user) => {
    expect(user).toBeNull();
  });
});

test("存在するDIDでユーザーを検索するとユーザーが取得できること", async () => {
  // 準備
  const testUser = createTestUser();
  await userRepository.save(testUser);
  
  // 実行
  const result = await userRepository.findByDid(testUser.did);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((user) => {
    expect(user).not.toBeNull();
    if (user) {
      expect(user.id).toBe(testUser.id);
      expect(user.did).toBe(testUser.did);
      expect(user.profile.displayName).toBe(testUser.profile.displayName);
    }
  });
});

test("存在しないDIDでユーザーを検索するとnullが返されること", async () => {
  // 準備
  const nonExistentDid = `did:plc:${uuidv7()}`;
  
  // 実行
  const result = await userRepository.findByDid(nonExistentDid);
  
  // 検証
  expect(result.isOk()).toBe(true);
  result.map((user) => {
    expect(user).toBeNull();
  });
});

test("ユーザーを削除すると該当ユーザーが削除されること", async () => {
  // 準備
  const testUser = createTestUser();
  await userRepository.save(testUser);
  
  // 実行 - 削除
  const deleteResult = await userRepository.delete(testUser.id);
  
  // 検証 - 削除成功
  expect(deleteResult.isOk()).toBe(true);
  
  // 実行 - 確認
  const findResult = await userRepository.findById(testUser.id);
  
  // 検証 - 削除確認
  expect(findResult.isOk()).toBe(true);
  findResult.map((user) => {
    expect(user).toBeNull();
  });
}); 
