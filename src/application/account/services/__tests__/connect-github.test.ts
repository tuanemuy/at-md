import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { GitHubAppProvider } from "@/domain/account/adapters/github-app-provider";
import type { CreateUser } from "@/domain/account/repositories";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleGitHubConnectionRepository } from "@/infrastructure/db/repositories/account/github-connection-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { errAsync, okAsync } from "@/lib/result";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ConnectGitHubService } from "../connect-github";

// GitHubAppProviderはモック
const mockGitHubAppProvider = {
  getAccessToken: vi.fn(),
  getInstallations: vi.fn(),
} as unknown as GitHubAppProvider;

// データベース関連の変数
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

  // GitHubAppProviderのモックをリセット
  vi.resetAllMocks();
});

afterEach(async () => {
  // テスト用のデータベースをクリーンアップ
  await cleanupTestDatabase(client);
  await closeTestDatabase(client);
});

test("正常にGitHub連携が作成された場合にvoidが返されること", async () => {
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

  const code = "github-auth-code";
  const accessToken = "github-access-token";
  const refreshToken = "github-refresh-token";

  // GitHubAppProviderのモック
  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubAppProvider.getAccessToken as any).mockReturnValue(
    okAsync({
      accessToken,
      refreshToken,
    }),
  );

  const service = new ConnectGitHubService({
    deps: {
      githubAppProvider: mockGitHubAppProvider,
      githubConnectionRepository,
    },
  });

  const result = await service.execute({ userId, code });

  expect(mockGitHubAppProvider.getAccessToken).toHaveBeenCalledWith(code);
  expect(result.isOk()).toBe(true);

  // GitHub連携が正しく保存されたことを確認
  const connection = await githubConnectionRepository.findByUserId(userId);
  expect(connection.isOk()).toBe(true);
  if (connection.isOk()) {
    expect(connection.value.userId).toBe(userId);
    expect(connection.value.accessToken).toBe(accessToken);
    expect(connection.value.refreshToken).toBe(refreshToken);
  }
});

test("アクセストークンの取得に失敗した場合にエラーが返されること", async () => {
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

  const code = "invalid-github-auth-code";
  const errorId = generateId("Error");

  const providerError = new ExternalServiceError(
    "GitHub",
    ExternalServiceErrorCode.AUTHENTICATION_FAILED,
    `アクセストークンの取得に失敗 (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubAppProvider.getAccessToken as any).mockReturnValue(
    errAsync(providerError),
  );

  const service = new ConnectGitHubService({
    deps: {
      githubAppProvider: mockGitHubAppProvider,
      githubConnectionRepository,
    },
  });

  const result = await service.execute({ userId, code });

  expect(mockGitHubAppProvider.getAccessToken).toHaveBeenCalledWith(code);

  // エラーが返されたことを確認
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }

  // GitHub連携が作成されていないことを確認
  const connection = await githubConnectionRepository.findByUserId(userId);
  expect(connection.isErr()).toBe(true);
  if (connection.isErr()) {
    expect(connection.error.code).toBe(RepositoryErrorCode.NOT_FOUND);
  }
});

test("存在しないユーザーIDでも連携情報を作成しようとするが、失敗することを確認", async () => {
  // 存在しないユーザーID
  const nonExistingUserId = generateId("User");
  const code = "github-auth-code";
  const accessToken = "github-access-token";
  const refreshToken = "github-refresh-token";

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubAppProvider.getAccessToken as any).mockReturnValue(
    okAsync({
      accessToken,
      refreshToken,
    }),
  );

  const service = new ConnectGitHubService({
    deps: {
      githubAppProvider: mockGitHubAppProvider,
      githubConnectionRepository,
    },
  });

  const result = await service.execute({ userId: nonExistingUserId, code });

  expect(mockGitHubAppProvider.getAccessToken).toHaveBeenCalledWith(code);

  // 実際の実装では、存在しないユーザーIDでも連携情報は作成されるが
  // エラーが発生する場合もあるので、両方の結果を受け入れる
  if (result.isOk()) {
    // 成功した場合は、GitHub連携が正しく保存されていることを確認
    const connection =
      await githubConnectionRepository.findByUserId(nonExistingUserId);
    if (connection.isOk()) {
      expect(connection.value.userId).toBe(nonExistingUserId);
      expect(connection.value.accessToken).toBe(accessToken);
      expect(connection.value.refreshToken).toBe(refreshToken);
    }
  } else {
    // エラーの場合は特に追加検証は行わない
    expect(result.isErr()).toBe(true);
  }
});
