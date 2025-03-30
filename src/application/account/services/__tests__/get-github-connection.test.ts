import { expect, test, beforeEach, afterEach } from "vitest";
import { GetGitHubConnectionsService } from "../get-github-connection";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { GitHubConnection } from "@/domain/account/models/github-connection";
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

test("GitHub連携が存在する場合に連携情報が返されること", async () => {
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

  const service = new GetGitHubConnectionsService({
    deps: {
      githubConnectionRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.userId).toEqual(userId);
    expect(result.value.accessToken).toEqual("github-access-token");
    expect(result.value.refreshToken).toEqual("github-refresh-token");
  }
});

test("GitHub連携が存在しない場合にエラーが返されること", async () => {
  const nonExistingUserId = generateId("User");

  const service = new GetGitHubConnectionsService({
    deps: {
      githubConnectionRepository,
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

