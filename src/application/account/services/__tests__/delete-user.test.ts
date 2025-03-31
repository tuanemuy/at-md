import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { CreateUser } from "@/domain/account/repositories";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test } from "vitest";
import { DeleteUserService } from "../delete-user";

let client: PGlite;
let userRepository: DrizzleUserRepository;

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  userRepository = new DrizzleUserRepository(db);
});

afterEach(async () => {
  // テスト用のデータベースをクリーンアップ
  await cleanupTestDatabase(client);
  await closeTestDatabase(client);
});

test("ユーザー削除が成功した場合にvoidが返されること", async () => {
  // テスト用ユーザーを作成
  const did = "test-did";
  const testUser: CreateUser = {
    did,
    profile: {
      displayName: "Test User",
      description: null,
      avatarUrl: null,
      bannerUrl: null,
    },
  };

  // ユーザーを作成
  const createResult = await userRepository.create(testUser);
  expect(createResult.isOk()).toBe(true);
  const userId = createResult.isOk() ? createResult.value.id : "";

  const service = new DeleteUserService({
    deps: {
      userRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(result.isOk()).toBe(true);

  // ユーザーが削除されたか確認
  const findResult = await userRepository.findById(userId);
  expect(findResult.isErr()).toBe(true);
  if (findResult.isErr()) {
    expect(findResult.error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  }
});

test("存在しないユーザーIDの場合もエラーにならずに成功すること", async () => {
  const nonExistingUserId = generateId("User");

  const service = new DeleteUserService({
    deps: {
      userRepository,
    },
  });

  const result = await service.execute({ userId: nonExistingUserId });

  // 多くの場合、存在しないエンティティの削除は成功として扱われる
  expect(result.isOk()).toBe(true);
});
