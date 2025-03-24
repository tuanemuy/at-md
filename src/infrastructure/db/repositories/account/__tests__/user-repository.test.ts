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
      displayName: user.profile.displayName || "",
      description: user.profile.description || "",
      avatarUrl: user.profile.avatarUrl || "https://example.com/avatar.png",
      bannerUrl: user.profile.bannerUrl || "https://example.com/banner.png",
    },
  };
};

// テスト用のUpdateUserデータ
const createTestUpdateUser = (id: string): UpdateUser => {
  const user = createTestUser();
  return {
    id,
    did: user.did,
    profile: {
      displayName: "更新されたユーザー名",
      description: "更新された説明文",
      avatarUrl: user.profile.avatarUrl || "https://example.com/avatar.png",
      bannerUrl: user.profile.bannerUrl || "https://example.com/banner.png",
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

test("既存ユーザーを更新するとユーザー情報が正常に更新されること", async () => {
  // 準備 - 最初のユーザーを作成
  const createData = createTestCreateUser();
  const createResult = await userRepository.create(createData);

  let userId = "";
  createResult.map((user) => {
    userId = user.id;
  });

  // 更新用のユーザー情報
  const updateData = createTestUpdateUser(userId);

  // 実行
  const result = await userRepository.update(updateData);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((savedUser) => {
    expect(savedUser.id).toBe(userId);
    expect(savedUser.profile.displayName).toBe(updateData.profile.displayName);
    expect(savedUser.profile.description).toBe(updateData.profile.description);
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
    expect(user).not.toBeNull();
    if (user) {
      expect(user.id).toBe(userId);
      expect(user.did).toBe(createData.did);
      expect(user.profile).toEqual(createData.profile);
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
  const createData = createTestCreateUser();
  const createResult = await userRepository.create(createData);

  // 実行
  const result = await userRepository.findByDid(createData.did);

  // 検証
  expect(result.isOk()).toBe(true);
  result.map((user) => {
    expect(user).not.toBeNull();
    if (user) {
      expect(user.did).toBe(createData.did);
      expect(user.profile).toEqual(createData.profile);
    }
  });
});

test("存在しないDIDでユーザーを検索するとnullが返されること", async () => {
  // 準備
  const nonExistentDid = "did:example:nonexistent";

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
  expect(findResult.isOk()).toBe(true);
  findResult.map((user) => {
    expect(user).toBeNull();
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
