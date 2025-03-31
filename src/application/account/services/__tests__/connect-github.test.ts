import type { GitHubAppProvider } from "@/domain/account/adapters/github-app-provider";
import type { GitHubConnection } from "@/domain/account/models/github-connection";
import type { GitHubConnectionRepository } from "@/domain/account/repositories";
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
import { errAsync, okAsync } from "@/lib/result";
import { beforeEach, expect, test, vi } from "vitest";
import { ConnectGitHubService } from "../connect-github";

// モック
const mockGitHubAppProvider = {
  getAccessToken: vi.fn(),
  getInstallations: vi.fn(),
} as unknown as GitHubAppProvider;

const mockGitHubConnectionRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  deleteByUserId: vi.fn(),
  delete: vi.fn(),
} as unknown as GitHubConnectionRepository;

beforeEach(() => {
  vi.resetAllMocks();
});

test("正常にGitHub連携が作成された場合にvoidが返されること", async () => {
  const userId = generateId("User");
  const code = "github-auth-code";
  const accessToken = "github-access-token";
  const refreshToken = "github-refresh-token";

  const githubConnection: GitHubConnection = {
    id: generateId("GitHubConnection"),
    userId,
    accessToken,
    refreshToken,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubAppProvider.getAccessToken as any).mockReturnValue(
    okAsync({
      accessToken,
      refreshToken,
    }),
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.create as any).mockReturnValue(
    okAsync(githubConnection),
  );

  const service = new ConnectGitHubService({
    deps: {
      githubAppProvider: mockGitHubAppProvider,
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  const result = await service.execute({ userId, code });

  expect(mockGitHubAppProvider.getAccessToken).toHaveBeenCalledWith(code);
  expect(mockGitHubConnectionRepository.create).toHaveBeenCalledWith({
    userId,
    accessToken,
    refreshToken: refreshToken,
  });
  expect(result.isOk()).toBe(true);
});

test("アクセストークンの取得に失敗した場合にエラーが返されること", async () => {
  const userId = generateId("User");
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
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  const result = await service.execute({ userId, code });

  expect(mockGitHubAppProvider.getAccessToken).toHaveBeenCalledWith(code);
  expect(mockGitHubConnectionRepository.create).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});

test("GitHub連携の作成に失敗した場合にエラーが返されること", async () => {
  const userId = generateId("User");
  const code = "github-auth-code";
  const accessToken = "github-access-token";
  const refreshToken = "github-refresh-token";
  const errorId = generateId("Error");

  const repoError = new RepositoryError(
    RepositoryErrorCode.CONSTRAINT_VIOLATION,
    `既に連携が存在します (${errorId})`,
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubAppProvider.getAccessToken as any).mockReturnValue(
    okAsync({
      accessToken,
      refreshToken,
    }),
  );

  // biome-ignore lint/suspicious/noExplicitAny: モックの型キャストに必要
  (mockGitHubConnectionRepository.create as any).mockReturnValue(
    errAsync(repoError),
  );

  const service = new ConnectGitHubService({
    deps: {
      githubAppProvider: mockGitHubAppProvider,
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  const result = await service.execute({ userId, code });

  expect(mockGitHubAppProvider.getAccessToken).toHaveBeenCalledWith(code);
  expect(mockGitHubConnectionRepository.create).toHaveBeenCalledWith({
    userId,
    accessToken,
    refreshToken: refreshToken,
  });
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});
