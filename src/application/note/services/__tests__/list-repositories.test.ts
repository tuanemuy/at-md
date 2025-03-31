import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { Profile } from "@/domain/account/models";
import type { GitHubConnection } from "@/domain/account/models";
import type { GitHubRepository } from "@/domain/note/dtos";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
  ExternalServiceError,
  ExternalServiceErrorCode,
  RepositoryError,
  RepositoryErrorCode,
} from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleGitHubConnectionRepository } from "@/infrastructure/db/repositories/account/github-connection-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { errAsync, okAsync } from "@/lib/result";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ListRepositoriesService } from "../list-repositories";

// データベース関連の変数
let client: PGlite;
let userRepository: DrizzleUserRepository;
let githubConnectionRepository: DrizzleGitHubConnectionRepository;

// GitHubContentProviderのモック
const mockGitHubContentProvider = {
  listRepositories: vi.fn(),
  getContent: vi.fn(),
  getContentByInstallation: vi.fn(),
  listPaths: vi.fn(),
  setupWebhook: vi.fn(),
};

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  userRepository = new DrizzleUserRepository(db);
  githubConnectionRepository = new DrizzleGitHubConnectionRepository(db);

  // モックをリセット
  vi.resetAllMocks();
});

afterEach(async () => {
  // テスト用のデータベースをクリーンアップ
  await cleanupTestDatabase(client);
  await closeTestDatabase(client);
});

// テスト用ユーザーを作成するヘルパー関数
async function createTestUser() {
  const did = `did:plc:${generateId("DID")}`;
  const profile: Profile = {
    displayName: "Test User",
    description: "テスト用ユーザー",
    avatarUrl: null,
    bannerUrl: null,
  };

  const createUserResult = await userRepository.create({
    did,
    profile,
  });

  if (createUserResult.isErr()) {
    console.error("ユーザーの作成に失敗:", createUserResult.error);
    throw new Error("テストユーザーの作成に失敗しました");
  }

  return createUserResult.value;
}

test("GitHub連携が存在する場合にリポジトリ一覧が返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // GitHub連携情報を作成
  const accessToken = "github-access-token";
  await githubConnectionRepository.create({
    userId,
    accessToken,
    refreshToken: null,
  });

  // リポジトリ一覧のモックを設定
  const repositories: GitHubRepository[] = [
    {
      owner: "owner1",
      name: "repo1",
      fullName: "owner1/repo1",
    },
    {
      owner: "owner2",
      name: "repo2",
      fullName: "owner2/repo2",
    },
  ];

  // listRepositoriesのモック応答を設定
  mockGitHubContentProvider.listRepositories.mockReturnValue(
    okAsync(repositories),
  );

  // サービスのインスタンスを作成
  const service = new ListRepositoriesService({
    deps: {
      githubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockGitHubContentProvider.listRepositories).toHaveBeenCalledWith(
    accessToken,
  );
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toEqual(repositories);
    expect(result.value.length).toBe(2);
  }
});

test("GitHub連携が存在しない場合にエラーが返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // GitHub連携情報は作成しない

  const service = new ListRepositoriesService({
    deps: {
      githubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockGitHubContentProvider.listRepositories).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBeInstanceOf(RepositoryError);
    expect((result.error.cause as RepositoryError).code).toBe(
      RepositoryErrorCode.NOT_FOUND,
    );
  }
});

test("リポジトリ一覧の取得に失敗した場合にエラーが返されること", async () => {
  // テスト用のユーザーを作成
  const user = await createTestUser();
  const userId = user.id;

  // GitHub連携情報を作成
  const accessToken = "github-access-token";
  await githubConnectionRepository.create({
    userId,
    accessToken,
    refreshToken: null,
  });

  // GitHub APIのエラーをシミュレート
  const providerError = new ExternalServiceError(
    "GitHubContent",
    ExternalServiceErrorCode.REQUEST_FAILED,
    "Failed to list repositories",
  );

  mockGitHubContentProvider.listRepositories.mockReturnValue(
    errAsync(providerError),
  );

  const service = new ListRepositoriesService({
    deps: {
      githubConnectionRepository,
      githubContentProvider: mockGitHubContentProvider,
    },
  });

  // 実行
  const result = await service.execute({ userId });

  // 検証
  expect(mockGitHubContentProvider.listRepositories).toHaveBeenCalledWith(
    accessToken,
  );
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});
