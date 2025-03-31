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
import { GetUserByIdService } from "../get-user-by-id";

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

test("存在するユーザーIDの場合にユーザー情報が返されること", async () => {
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

  // サービスを初期化
  const service = new GetUserByIdService({
    deps: {
      userRepository,
    },
  });

  // テスト実行
  const result = await service.execute({ userId });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.id).toEqual(userId);
    expect(result.value.did).toEqual("test-did");
    expect(result.value.profile.displayName).toEqual("Test User");
  }
});

test("存在しないユーザーIDの場合にエラーが返されること", async () => {
  const nonExistingUserId = generateId("User");

  const service = new GetUserByIdService({
    deps: {
      userRepository,
    },
  });

  const result = await service.execute({ userId: nonExistingUserId });

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    const repositoryError = result.error.cause as RepositoryError;
    expect(repositoryError).toBeInstanceOf(RepositoryError);
    expect(repositoryError.code).toBe(RepositoryErrorCode.NOT_FOUND);
  }
});
