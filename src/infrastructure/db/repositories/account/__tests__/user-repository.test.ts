import type { User } from "@/domain/account/models";
import type { CreateUser, UpdateUser } from "@/domain/account/repositories";
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
import { DrizzleUserRepository } from "../user-repository";

// テスト用のデータベース
let client: PGlite;
let userRepository: DrizzleUserRepository;

// テスト用のユーザーデータ
const createTestUser = (): User => ({
  id: uuidv7(),
  did: `did:example:${Math.floor(Math.random() * 1000)}`,
  profile: {
    displayName: "テストユーザー",
    description: "これはテスト用のユーザーです。",
    avatarUrl: "https://example.com/avatar.png",
    bannerUrl: "https://example.com/banner.png",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// テスト用のCreateUserデータ
const createTestCreateUser = (): CreateUser => {
  const user = createTestUser();
  return {
    did: user.did,
    profile: {
      displayName: user.profile.displayName,
      description: user.profile.description,
      avatarUrl: user.profile.avatarUrl,
      bannerUrl: user.profile.bannerUrl,
    },
  };
};

// テスト用のUpdateUserデータ
const createTestUpdateUser = (id: string, did: string): UpdateUser => {
  return {
    id,
    did,
    profile: {
      displayName: "更新されたユーザー名",
      description: "更新された説明文",
      avatarUrl: "https://example.com/avatar-updated.png",
      bannerUrl: "https://example.com/banner-updated.png",
    },
  };
};

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

test("新規ユーザーを作成するとユーザーが正常に作成されること", async () => {
  // 準備
  const testUser = createTestCreateUser();

  // 実行
  const result = await userRepository.create(testUser);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedUser) => {
    expect(savedUser.did).toBe(testUser.did);
    expect(savedUser.profile).toEqual(testUser.profile);
    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.updatedAt).toBeInstanceOf(Date);
  });
});

test("プロフィールの一部がnullの新規ユーザーを作成できること", async () => {
  // 準備
  const testUser = createTestCreateUser();
  testUser.profile.description = null;
  testUser.profile.avatarUrl = null;

  // 実行
  const result = await userRepository.create(testUser);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedUser) => {
    expect(savedUser.did).toBe(testUser.did);
    expect(savedUser.profile.displayName).toBe(testUser.profile.displayName);
    expect(savedUser.profile.description).toBeNull();
    expect(savedUser.profile.avatarUrl).toBeNull();
    expect(savedUser.profile.bannerUrl).toBe(testUser.profile.bannerUrl);
  });
});

test("既存ユーザーを更新するとユーザー情報が正常に更新されること", async () => {
  // 準備 - 最初のユーザーを作成
  const createData = createTestCreateUser();
  const createResult = await userRepository.create(createData);

  let userId = "";
  let userDid = "";
  createResult.map((user) => {
    userId = user.id;
    userDid = user.did;
  });

  // 更新用のユーザー情報
  const updateData = createTestUpdateUser(userId, userDid);

  // 実行
  const result = await userRepository.update(updateData);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedUser) => {
    expect(savedUser.id).toBe(userId);
    expect(savedUser.did).toBe(userDid);
    expect(savedUser.profile.displayName).toBe(updateData.profile.displayName);
    expect(savedUser.profile.description).toBe(updateData.profile.description);
    expect(savedUser.profile.avatarUrl).toBe(updateData.profile.avatarUrl);
    expect(savedUser.profile.bannerUrl).toBe(updateData.profile.bannerUrl);
    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.updatedAt).toBeInstanceOf(Date);
  });
});

test("存在するIDでユーザーを検索するとユーザーが取得できること", async () => {
  // 準備
  const createData = createTestCreateUser();
  const createResult = await userRepository.create(createData);

  let userId = "";
  createResult.map((user) => {
    userId = user.id;
  });

  // 実行
  const result = await userRepository.findById(userId);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((user) => {
    expect(user.id).toBe(userId);
    expect(user.did).toBe(createData.did);
    expect(user.profile.displayName).toBe(createData.profile.displayName);
    expect(user.profile.description).toBe(createData.profile.description);
    expect(user.profile.avatarUrl).toBe(createData.profile.avatarUrl);
    expect(user.profile.bannerUrl).toBe(createData.profile.bannerUrl);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});

test("存在しないIDでユーザーを検索するとNOT_FOUNDエラーが返されること", async () => {
  // 準備
  const nonExistentId = uuidv7();

  // 実行
  const result = await userRepository.findById(nonExistentId);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  });
});

test("存在するDIDでユーザーを検索するとユーザーが取得できること", async () => {
  // 準備
  const createData = createTestCreateUser();
  await userRepository.create(createData);

  // 実行
  const result = await userRepository.findByDid(createData.did);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((user) => {
    expect(user.did).toBe(createData.did);
    expect(user.profile.displayName).toBe(createData.profile.displayName);
    expect(user.profile.description).toBe(createData.profile.description);
    expect(user.profile.avatarUrl).toBe(createData.profile.avatarUrl);
    expect(user.profile.bannerUrl).toBe(createData.profile.bannerUrl);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
});

test("存在しないDIDでユーザーを検索するとNOT_FOUNDエラーが返されること", async () => {
  // 準備
  const nonExistentDid = "did:example:nonexistent";

  // 実行
  const result = await userRepository.findByDid(nonExistentDid);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  });
});

test("ユーザーを削除すると該当ユーザーが削除されること", async () => {
  // 準備
  const createData = createTestCreateUser();
  const createResult = await userRepository.create(createData);

  let userId = "";
  createResult.map((user) => {
    userId = user.id;
  });

  // 実行
  const deleteResult = await userRepository.delete(userId);

  // 検証
  expect(deleteResult.isOk()).toBe(true);

  // 削除されたことを確認
  const findResult = await userRepository.findById(userId);
  expect(findResult.isErr()).toBe(true);
  findResult.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  });
});

test("重複するDIDでユーザーを作成すると失敗すること", async () => {
  // 準備 - 最初のユーザーを作成
  const createData = createTestCreateUser();
  await userRepository.create(createData);

  // 同じDIDで別のユーザーを作成
  const duplicateData = createTestCreateUser();
  duplicateData.did = createData.did;

  // 実行
  const result = await userRepository.create(duplicateData);

  // 検証
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.code).toBe(RepositoryErrorCode.UNIQUE_VIOLATION);
  });
});
