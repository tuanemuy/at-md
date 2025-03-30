import { expect, test, beforeEach, afterEach } from "vitest";
import { DisconnectGitHubService } from "../disconnect-github";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { PGlite } from "@electric-sql/pglite";
import { 
  getTestDatabase, 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeTestDatabase 
} from "@/application/__test__/setup";
import { DrizzleGitHubConnectionRepository } from "@/infrastructure/db/repositories/account/github-connection-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { generateId } from "@/domain/types/id";
import type { CreateUser } from "@/domain/account/repositories";
import type { CreateGitHubConnection } from "@/domain/account/repositories";

let client: PGlite;
let githubConnectionRepository: DrizzleGitHubConnectionRepository;
let userRepository: DrizzleUserRepository;

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  githubConnectionRepository = new DrizzleGitHubConnectionRepository(db);
  userRepository = new DrizzleUserRepository(db);
});

afterEach(async () => {
  // テスト用のデータベースをクリーンアップ
  await cleanupTestDatabase(client);
  await closeTestDatabase(client);
});

test("GitHub連携の解除が成功した場合にvoidが返されること", async () => {
  // テスト用ユーザーを作成
  const testUser: CreateUser = {
    did: "test-did",
    profile: {
      displayName: "Test User",
      description: null,
      avatarUrl: null,
      bannerUrl: null,
    },
  };
  
  const createUserResult = await userRepository.create(testUser);
  expect(createUserResult.isOk()).toBe(true);
  const userId = createUserResult.isOk() ? createUserResult.value.id : "";
  
  // GitHub連携情報を作成
  const connection: CreateGitHubConnection = {
    userId,
    accessToken: "github-access-token",
    refreshToken: "github-refresh-token",
  };
  
  const createConnectionResult = await githubConnectionRepository.create(connection);
  expect(createConnectionResult.isOk()).toBe(true);

  const service = new DisconnectGitHubService({
    deps: {
      githubConnectionRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(result.isOk()).toBe(true);
  
  // 連携が削除されたか確認
  const findResult = await githubConnectionRepository.findByUserId(userId);
  expect(findResult.isErr()).toBe(true);
  if (findResult.isErr()) {
    expect(findResult.error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  }
});

test("GitHub連携がない場合でも成功すること", async () => {
  const nonExistingUserId = generateId("User");

  const service = new DisconnectGitHubService({
    deps: {
      githubConnectionRepository,
    },
  });

  const result = await service.execute({ userId: nonExistingUserId });

  // 存在しないデータの削除は成功として扱われる
  expect(result.isOk()).toBe(true);
});

